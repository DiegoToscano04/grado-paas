
---

# INFORME TÉCNICO DETALLADO: MICROSERVICIO 03 (MS-03)
**Nombre del Componente:** `ms-03-k8s-orchestrator` (Orquestador de Clúster y Observabilidad)
**Rol en el Sistema:** Motor de ejecución física, gestor de ciclo de vida de Kubernetes, consumidor de eventos (Worker) y proveedor de telemetría en tiempo real.

## 1. Visión General
El MS-03 es el único componente de la plataforma que tiene permisos y credenciales para interactuar directamente con el clúster físico de Kubernetes (MicroK8s). Su responsabilidad es doble: por un lado, actúa como un trabajador silencioso en segundo plano que materializa o destruye la infraestructura solicitada; por otro lado, actúa como una ventana de observabilidad que permite al Frontend consultar el estado de los contenedores y leer sus logs en tiempo real sin sobrecargar la base de datos principal.

## 2. Stack Tecnológico y Herramientas
*   **Lenguaje:** Python 3.12 (Ideal para scripting de infraestructura y automatización).
*   **Framework API:** FastAPI 0.110.0 con Uvicorn 0.29.0.
*   **Cliente Kubernetes:** `kubernetes` (v29.0.0) - Librería oficial para interactuar con la API de K8s.
*   **Cliente AMQP:** `pika` (v1.3.2) - Protocolo estándar para la conexión y consumo de colas en RabbitMQ.
*   **Cliente HTTP:** `requests` - Utilizado para emitir Webhooks (Callbacks) de vuelta al MS-01.
*   **Ejecución de Subprocesos:** Librería nativa `subprocess` de Python para invocaciones seguras a binarios del sistema operativo (`kubectl`).

## 3. Arquitectura de Software: Arquitectura Híbrida (Event-Driven + SOA)
El MS-03 implementa una arquitectura híbrida con una **doble personalidad** técnica, gestionada mediante concurrencia (Multithreading):
*   **La Cara "Worker" (Asíncrona - Event Driven):** Al arrancar la aplicación, el ciclo de vida (`lifespan`) de FastAPI levanta hilos en segundo plano (`daemon threads`). Estos hilos se conectan a RabbitMQ y se quedan bloqueados escuchando eventos. No bloquean el hilo principal de red.
*   **La Cara "API REST" (Síncrona - SOA):** El hilo principal de Uvicorn queda libre para servir peticiones HTTP GET extremadamente rápidas, permitiendo que múltiples estudiantes consulten los logs de sus proyectos simultáneamente sin interferir con los despliegues en curso.

## 4. Patrones de Diseño Aplicados
1.  **CQRS (Command Query Responsibility Segregation):** Se aplicó este patrón a nivel macro-arquitectónico. El MS-01 maneja los *Comandos* (escrituras, aprobaciones, cuotas) y el MS-03 maneja las *Consultas* de infraestructura (lecturas de logs y estados de Pods). Esto evita que el MS-01 se convierta en un cuello de botella.
2.  **Patrón Worker / Consumer:** Desacopla la ingesta de trabajos de su ejecución. El usuario no espera frente a una pantalla de carga a que Kubernetes descargue una imagen pesada de DockerHub; el worker toma el trabajo de la cola y lo procesa a su propio ritmo.
3.  **Webhook / Callback Pattern:** Como la comunicación de entrada es asíncrona (RabbitMQ), el MS-03 necesita informar el resultado. Utiliza un webhook (petición PATCH HTTP) hacia el MS-01 firmada con una `X-Internal-API-Key` para avisar que el despliegue pasó a estado `DEPLOYED` o `FAILED`.
4.  **Despliegue Declarativo (Idempotencia):** En lugar de usar llamadas imperativas (`create_namespaced_deployment`), el sistema utiliza un enfoque declarativo puro, delegando la reconciliación de estados al motor nativo de Kubernetes.

## 5. Lógica Core: El Motor de Despliegue (`k8s_deployer.py`)
Es el encargado de alterar el estado del clúster.
*   **Aprovisionamiento de Namespaces:** Antes de cualquier despliegue, verifica la existencia del Namespace aislado del estudiante. Si no existe, lo aprovisiona usando la API de Python (`core_v1.create_namespace`).
*   **Destrucción en Cascada (Teardown):** Para el RF-049, en lugar de borrar recurso por recurso, emite una orden de eliminación del Namespace (`core_v1.delete_namespace`). Kubernetes, por diseño, aplica un "Garbage Collection" automático, destruyendo Pods, Ingress, PVCs y NetworkPolicies de forma atómica y liberando la memoria del servidor físico.
*   **Integración Subprocess (Rolling Updates):** Para solucionar el clásico error `409 Conflict` (Already Exists) de las APIs imperativas, el MS-03 une todos los manifiestos YAML en un solo bloque de texto y lo inyecta a través de la entrada estándar (`stdin`) al comando `microk8s kubectl apply -f -`. Esto garantiza que los **redespliegues** (cambios en el YAML del estudiante) se apliquen como un *Rolling Update* sin tiempo de inactividad y sin borrar volúmenes persistentes (RF-048).

## 6. Lógica Core: Observabilidad en Tiempo Real (`k8s_observer.py`)
Módulo de solo lectura que dota de "ojos" al Frontend.
*   **Telemetría de Pods:** Utiliza `list_namespaced_pod` para escanear un proyecto. Filtra y calcula datos críticos como la fase del contenedor (`Running`, `Pending`, `CrashLoopBackOff`), la IP interna asignada y cuenta las veces que el contenedor ha crasheado (`restart_count`), vital para depuración.
*   **Streaming de Logs Simulado:** Implementa `read_namespaced_pod_log` limitando la salida a las últimas líneas (`tail_lines=200`) para proteger la memoria RAM del servidor y el ancho de banda. Combinado con el *Short Polling* del Frontend de React, crea una ilusión perfecta de una terminal SSH en vivo.

## 7. Comunicación Asíncrona y Resiliencia (RabbitMQ)
*   **Durable Queues:** Las colas `deploy.queue` y `terminate.queue` están configuradas como persistentes. Si el MS-03 se reinicia o el servidor físico se apaga por un corte de luz, los trabajos aprobados por el administrador no se pierden; esperan en el disco duro de RabbitMQ hasta que el MS-03 vuelva a estar en línea.
*   **Manejo de ACKs (Acknowledge):** El trabajador de Python solo envía un `ch.basic_ack` a RabbitMQ cuando el despliegue y el webhook a Java han finalizado con éxito. Si ocurre un error crítico o Kubernetes rechaza el manifiesto, el sistema captura la excepción, avisa a Java (`FAILED`) y saca el mensaje de la cola de forma segura.

## 8. Endpoints Expuestos (Capa REST)
A pesar de ser principalmente un Worker, expone una API protegida por políticas CORS estrictas (limitadas al origen del Frontend `http://localhost:5173`):
*   `GET /health`: Sonda de vitalidad. Intenta listar los namespaces para probar activamente que el certificado `kubeconfig` es válido y la API de K8s está respondiendo.
*   `GET /api/k8s/{namespace}/status`: Retorna un arreglo JSON con la salud, reinicios e IPs de los contenedores de un estudiante.
*   `GET /api/k8s/{namespace}/logs/{pod_name}`: Extrae el Standard Output (stdout) y Standard Error (stderr) del contenedor especificado, esencial para que el estudiante diagnostique errores de su propio código.

---
