
---

# INFORME GENERAL DE ARQUITECTURA E INTEGRACIÓN
**Proyecto:** PaaS Core Education (Plataforma Educativa de Despliegue de Contenedores)
**Paradigma Arquitectónico:** Microservicios Políglotas, Diseño Orientado a Eventos (EDA) y CQRS.

## 1. Resumen Ejecutivo de la Arquitectura
La plataforma "PaaS Core Education" ha sido diseñada como un sistema distribuido nativo de la nube (Cloud-Native). Se aleja de los monolitos tradicionales adoptando una arquitectura de **Microservicios Políglotas**, seleccionando el mejor lenguaje y tecnología para cada carga de trabajo específica. 

El sistema integra un Frontend reactivo (React), un núcleo de reglas de negocio fuertemente tipado (Java/Spring Boot), motores de infraestructura de alto rendimiento (Python/FastAPI), un bus de mensajería (RabbitMQ) para operaciones asíncronas y un motor de base de datos híbrido (PostgreSQL). Toda la plataforma converge en un clúster de Kubernetes (MicroK8s) que actúa como el entorno de ejecución final.

## 2. Ecosistema de Componentes (Topología)

El sistema se divide en 5 grandes bloques tecnológicos que interactúan en red:

1.  **Frontend (React SPA):** La capa de presentación. Gestiona la experiencia de usuario (UX) mediante *Client-Side Routing*, llamadas HTTP asíncronas con caché inteligente (React Query) y gestión de estado global (Zustand).
2.  **MS-01 (Identity & Core Business - Java):** El orquestador maestro. Escudo de seguridad (JWT/Cookies), gestor de identidades, administrador de cuotas y base central de auditoría. Diseñado bajo *Arquitectura Hexagonal*.
3.  **MS-02 (Composer Engine - Python):** El traductor *Stateless* (sin estado). Recibe texto YAML, lo valida contra contratos estrictos y utiliza un motor de plantillas (Jinja2) para devolver código Kubernetes puro.
4.  **MS-03 (Cluster Orchestrator - Python):** El ejecutor físico y vigilante. Es el único componente con credenciales para alterar el clúster de Kubernetes y leer la telemetría de los contenedores.
5.  **Capa de Datos y Mensajería:**
    *   *PostgreSQL:* Única fuente de verdad (Single Source of Truth) para el MS-01, combinando integridad relacional (Foreign Keys) con flexibilidad documental (JSONB para manifiestos).
    *   *RabbitMQ:* Bus de eventos (Message Broker) que garantiza la resiliencia y el desacoplamiento mediante el patrón Productor/Consumidor.

## 3. Integración y Flujos Core (¿Cómo funciona todo junto?)

La verdadera maestría de esta arquitectura radica en cómo los componentes "hablan" entre sí utilizando diferentes protocolos según la criticidad de la tarea.

### Flujo 1: Creación y Validación de Proyectos (Comunicación Síncrona)
*Objetivo: Traducir la intención del usuario a infraestructura sin tocar el clúster todavía.*
1.  El **Frontend** recolecta el archivo `docker-compose.yaml` y la arquitectura deseada, enviando un `POST` al **MS-01**.
2.  El **MS-01** detiene su procesamiento y realiza una llamada HTTP REST síncrona al **MS-02**.
3.  El **MS-02** parsea el YAML, rechaza configuraciones ilegales (ej. `restart`), calcula los recursos necesarios (leyendo `labels`) y genera las plantillas (Deployments, Ingress, NetworkPolicies de Calico). Devuelve todo este paquete al MS-01.
4.  El **MS-01** recibe los datos, verifica matemáticamente que los recursos no excedan las cuotas en **PostgreSQL**, guarda los manifiestos en una columna JSONB y le responde al **Frontend** con un estado `WAITING_USER_CONFIRMATION` (Borrador).

### Flujo 2: Despliegue Físico (Diseño Orientado a Eventos - Asíncrono)
*Objetivo: Aplicar los cambios en el servidor físico sin bloquear la pantalla del usuario.*
1.  El Administrador aprueba el proyecto en el **Frontend**.
2.  El **MS-01** actualiza la base de datos a `APPROVED`, escribe un log inmutable de auditoría y publica un mensaje JSON (el Payload con los manifiestos) en la cola `deploy.queue` de **RabbitMQ**. El MS-01 responde inmediatamente con un `200 OK` al frontend.
3.  El **MS-03**, que tiene un hilo en segundo plano (Daemon Thread) escuchando a RabbitMQ, atrapa el mensaje.
4.  El **MS-03** invoca un subproceso del sistema operativo (`kubectl apply`) para inyectar los manifiestos en MicroK8s de forma idempotente y declarativa.
5.  **El Callback (Cierre del Bucle):** Tras el éxito en K8s, el **MS-03** realiza una petición `PATCH` (Webhook) protegida con una API Key interna hacia el **MS-01**, diciendo *"Tarea completada"*.
6.  El **MS-01** actualiza el estado en PostgreSQL a `DEPLOYED`.
7.  El **Frontend**, que hace *Polling* silencioso cada 5 segundos, nota el cambio en la base de datos y dibuja la interfaz verde de éxito.

### Flujo 3: Observabilidad y Telemetría (Patrón CQRS)
*Objetivo: Leer el estado y los logs de los contenedores en tiempo real.*
1.  Para evitar saturar a la base de datos de Java con lecturas masivas de texto, la plataforma aplica el principio **CQRS** (Separación de Responsabilidades de Comando y Consulta).
2.  El **Frontend** ignora al MS-01 y le hace peticiones directas al **MS-03** (`/api/k8s/.../logs`).
3.  El **MS-03** consulta la API interna de Kubernetes, extrae el `stdout` del contenedor en memoria y lo devuelve. Esto permite a decenas de estudiantes ver sus logs simultáneamente sin que el motor de reglas de negocio (MS-01) sufra ningún impacto en su rendimiento.

### Flujo 4: Destrucción de Recursos (Teardown Seguro)
1.  El Estudiante hace clic en Eliminar en el **Frontend**.
2.  El **MS-01** pone el estado en `TERMINATING` y envía la orden a `terminate.queue` en **RabbitMQ**.
3.  El **MS-03** atrapa el mensaje y borra el Namespace en K8s (lo que desencadena un *Garbage Collection* nativo que destruye todo el aislamiento de red y volúmenes).
4.  El **MS-03** notifica al **MS-01**, quien aplica una eliminación lógica (`deleted_at = NOW()`) en **PostgreSQL**, ocultando el proyecto y devolviendo instantáneamente la cuota de recursos al estudiante.

## 4. Decisiones Arquitectónicas Justificadas

*   **¿Por qué usar Python para MS-02 y MS-03?**
    Python posee un ecosistema inigualable para la manipulación de diccionarios dinámicos (PyYAML) y renderizado de plantillas de texto (Jinja2), además de contar con el cliente de Kubernetes más maduro fuera de Go. Hacer este mismo procesamiento dinámico en un lenguaje fuertemente tipado como Java habría requerido excesiva reflexión (Reflection) y código frágil.
*   **¿Por qué usar Java para MS-01?**
    La gestión de transacciones bancarias, auditorías inmutables, seguridad basada en roles (RBAC) y control de identidad requiere de la robustez, el tipado estricto y el ecosistema maduro (Spring Security / Hibernate) que ofrece Java.
*   **¿Por qué RabbitMQ en lugar de peticiones HTTP directas para el despliegue?**
    El aprovisionamiento de imágenes de Docker y volúmenes en Kubernetes puede tardar desde segundos hasta minutos. Si MS-01 usara una petición HTTP síncrona hacia MS-03, el hilo del servidor de Java quedaría bloqueado ("colgado") esperando la respuesta, arriesgando un *Timeout* en el navegador del usuario. RabbitMQ garantiza **Resiliencia**: si MS-03 se reinicia o colapsa, el mensaje de despliegue queda guardado en la cola y se ejecutará en cuanto el servicio vuelva a estar en línea, sin perder datos.
*   **Seguridad Zero Trust en Red:**
    Tanto a nivel de Software (Cookies HttpOnly, validación CORS estricta) como a nivel de Infraestructura (NetworkPolicies de Calico generadas por MS-02 que bloquean por defecto cualquier comunicación entre proyectos), la plataforma garantiza un aislamiento total apto para entornos educativos multi-inquilino (Multi-tenant).

## 5. Conclusión
La plataforma "PaaS Core Education" no es un simple panel de control (CRUD); es un sistema de orquestación de infraestructura altamente cohesivo y débilmente acoplado. Demuestra la capacidad de entrelazar el ciclo de vida del software de usuario (Frontend), la gobernanza de datos (Backend), la comunicación distribuida (Mensajería) y la virtualización a nivel de sistema operativo (Kubernetes), culminando en un producto de software de grado empresarial, seguro y escalable.
