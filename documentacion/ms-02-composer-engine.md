
---

# INFORME TÉCNICO DETALLADO: MICROSERVICIO 02 (MS-02)
**Nombre del Componente:** `ms-02-composer-engine` (Motor de Validación y Traducción)
**Rol en el Sistema:** Procesador "Stateless" (sin estado), motor de reglas de negocio de infraestructura, generador de plantillas y validador de contratos.

## 1. Visión General
El MS-02 actúa como el "Traductor Inteligente" de la PaaS. Es un microservicio puro de procesamiento que no se conecta a ninguna base de datos. Su única responsabilidad es recibir un código fuente en formato `docker-compose.yaml`, someterlo a un escrutinio de seguridad (Validación Estricta), calcular sus necesidades computacionales, y traducir esa intención humana a manifiestos declarativos complejos de Kubernetes y Calico (Políticas de Red).

## 2. Stack Tecnológico y Herramientas
*   **Lenguaje:** Python 3.12 (Elegido por su superioridad y eficiencia nativa en el manejo de diccionarios, manipulación de strings y procesamiento de archivos YAML).
*   **Framework Principal:** FastAPI 0.110.0 (Framework web asíncrono de altísimo rendimiento).
*   **Servidor ASGI:** Uvicorn 0.29.0.
*   **Validación de Datos:** Pydantic 2.6.3 (Garantiza tipado estricto en Python, validando los DTOs de entrada y salida).
*   **Procesamiento YAML:** PyYAML 6.0.1 (Transforma el texto plano en diccionarios iterables de Python).
*   **Motor de Plantillas:** Jinja2 3.1.3 (El estándar de la industria en Python, equivalente a Go Templates usado por Helm).

## 3. Arquitectura de Software: Arquitectura Orientada a Servicios (SOA) y Diseño Stateless
A diferencia del MS-01 que usa Arquitectura Hexagonal por su alta carga de reglas de negocio relacionales, el MS-02 se diseñó bajo un modelo SOA (Service-Oriented Architecture) enfocado en el patrón **Stateless** (Sin Estado).
*   **Diseño Efímero:** El MS-02 no recuerda nada de peticiones anteriores. Recibe una entrada `(Request)`, aplica funciones puras de transformación matemática y de texto, y devuelve una salida `(Response)`. Esto permite que el MS-02 pueda escalar horizontalmente (levantar 10 copias del mismo si hay mucha demanda) sin conflictos de memoria.
*   **Separación por Capas (Layered Routing):**
    *   `app/api/`: Controladores (Endpoints) que gestionan el tráfico HTTP.
    *   `app/models/`: Esquemas de Pydantic que definen el contrato de datos (DTOs).
    *   `app/services/`: La lógica de procesamiento (`validator_service` y `generator_service`).
    *   `app/templates/`: Los archivos físicos `.yaml.j2` (Las "plantillas maestras" de infraestructura).

## 4. Patrones de Diseño Aplicados
1.  **Template Method (Método Plantilla):** Implementado mediante Jinja2. En lugar de concatenar *strings* manualmente en el código, se crearon archivos estáticos (`deployment.yaml.j2`, `statefulset.yaml.j2`, etc.) con "huecos" o variables (`{{ container_port }}`). El motor de Python solo inyecta el contexto y renderiza el resultado, aislando el diseño de infraestructura de la lógica de programación.
2.  **Fail-Fast (Falla Rápido):** El validador está diseñado para interrumpir la ejecución y devolver un error HTTP 400 al primer síntoma de una violación del contrato (ej. mala indentación), evitando procesamientos innecesarios.
3.  **Allow-List (Lista Blanca):** En ciberseguridad, en lugar de bloquear cosas malas (Blocklist), el MS-02 bloquea *todo* y solo permite lo explícitamente autorizado (ej. `ALLOWED_SERVICE_KEYS = {"image", "ports", "environment"...}`). Esto previene ataques de inyección de comandos no previstos.

## 5. Lógica Core: El Motor de Validación Estricta (`validator_service.py`)
Garantiza que el estudiante no intente vulnerar la plataforma ni salirse de las reglas académicas.
*   **Validación de Raíz:** Verifica mediante PyYAML que no existan atributos globales extraños (ej. un `restart` mal indentado) permitiendo únicamente `version` y `services`.
*   **Contrato de Nomenclatura:** Dependiendo de la `AppArchitecture` solicitada (ej. `THREE_TIER`), el motor exige matemáticamente que existan los servicios `front`, `back` y `db`. Si falta uno, o sobra uno (ej. `redis`), rechaza el archivo.
*   **Exposición Obligatoria:** Si el contenedor es de tipo web (`front`, `back`, `monolith`), el motor verifica obligatoriamente que exista la clave `ports`.
*   **Bloqueo de Construcción Local:** Rechaza explícitamente el uso de la directiva `build`, obligando a los estudiantes a usar imágenes pre-empaquetadas (`image`) provenientes de DockerHub para no saturar la CPU del servidor con compilaciones.

## 6. Lógica Core: El Motor de Generación (`generator_service.py`)
Es el corazón de la traducción. Lee el diccionario YAML válido y toma decisiones de arquitectura en fracciones de segundo:
*   **Enrutamiento de Carga de Trabajo (Workload Routing):** Si el servicio se llama `db`, el motor decide usar las plantillas `statefulset.yaml.j2` y `pvc.yaml.j2` (inyectando la ruta de montaje correcta dependiendo de si lee la palabra `postgres` o `mysql` en el nombre de la imagen). Si es web, usa `deployment.yaml.j2`.
*   **Traducción de Entorno (Environment):** Convierte el arreglo `environment: - KEY=VALUE` del docker-compose en un `ConfigMap` nativo de Kubernetes, y automáticamente inyecta la directiva `envFrom` en el Deployment para vincularlos.
*   **Exposición Dinámica (Networking):** Si el componente es web, genera un `Service` tipo `ClusterIP` y un `Ingress` calculando un subdominio único (`host_name = f"{service_name}-{namespace_name}.apps.lab.edu.co"`). Si es una Base de Datos "Standalone", genera un `NodePort`.

## 7. Inteligencia de Recursos y Seguridad Zero Trust
Este microservicio resuelve dos de los requerimientos funcionales más complejos de la tesis:
1.  **Cálculo Dinámico de Recursos:** El motor lee la sección `labels` del docker-compose. Si el estudiante solicita recursos (`paas.cpu_request_m`, `paas.storage_size_mb`), Python los convierte a la nomenclatura de Kubernetes (`m`, `Mi`, `Gi`) y los inyecta. Si no los provee, inyecta los valores **DEFAULTS** parametrizados. Finalmente, suma todos los consumos y devuelve el total absoluto (ej. 1.15 vCPU, 1408 MB) a Java para la validación de cuotas.
2.  **Generación de Políticas de Red (Calico):** El motor implementa una filosofía **Zero Trust** inyectando manifiestos de seguridad de forma invisible para el usuario:
    *   `netpol-default-deny`: Bloquea todo el tráfico cruzado en el Namespace por defecto.
    *   `netpol-allow-ingress`: Abre los puertos del Frontend/Backend exclusivamente hacia el Ingress Controller.
    *   `netpol-allow-internal`: Lee la arquitectura y crea túneles bidireccionales autorizados (ej. si es `THREE_TIER`, crea una regla estricta que dice: *La Base de datos solo puede recibir tráfico si el pod origen tiene la etiqueta 'app: back'*).

## 8. Endpoints Expuestos
La API es intencionalmente minimalista para reducir la superficie de ataque:
*   `GET /health`: Endpoint de sonda (Liveness Probe). Retorna el estado del motor para que un balanceador o el administrador sepan que el servicio de validación está vivo.
*   `POST /api/composer/validate`: Endpoint principal. Recibe el `ComposeValidationRequest` (Arquitectura, Namespace, Texto YAML) y devuelve un `ComposeValidationResponse` estructurado con booleanos de validación, errores detallados, cálculos de recursos y la lista cruda de manifiestos traducidos.
*   *(Nota de Seguridad)*: El servicio está protegido por reglas CORS que solo aceptan el tráfico interno autorizado o peticiones originadas explícitamente desde el entorno de confianza, mitigando ataques CSRF/SSRF.

---

