
---

# INFORME TÉCNICO DETALLADO: MICROSERVICIO 01 (MS-01)
**Nombre del Componente:** `ms-01-identity-auth` (Core Business & Identity Engine)
**Rol en el Sistema:** Orquestador principal, gestor de identidad, auditoría y máquina de estados.

## 1. Visión General
El MS-01 es el "Cerebro" de la Plataforma como Servicio (PaaS). Es el único componente expuesto directamente a los usuarios (Estudiantes y Administradores) para la gestión de reglas de negocio. Su responsabilidad es validar identidades, asegurar que se respeten las cuotas de infraestructura, mantener el historial inmutable de auditoría y orquestar la comunicación entre el motor de validación (MS-02) y el orquestador de Kubernetes (MS-03).

## 2. Stack Tecnológico y Herramientas
*   **Lenguaje:** Java 21 (Aprovechando *Records* para DTOs inmutables).
*   **Framework Principal:** Spring Boot 3.4.x.
*   **Gestor de Dependencias:** Gradle (Groovy).
*   **Base de Datos:** PostgreSQL 16 (Relacional + JSONB).
*   **Message Broker:** RabbitMQ 3 (vía `spring-boot-starter-amqp`).
*   **Seguridad:** Spring Security 6 + JWT (JSON Web Tokens) vía `jjwt`.
*   **ORM:** Hibernate 6 / Spring Data JPA.
*   **Librerías Auxiliares:** Lombok (reducción de código repetitivo/Boilerplate), Jackson (Serialización JSON), Spring Boot Mail (SMTP).

## 3. Arquitectura de Software: Arquitectura Hexagonal (Puertos y Adaptadores)
Para garantizar que la lógica de negocio sobreviva al paso del tiempo y a cambios de frameworks, el MS-01 se construyó bajo una estricta **Arquitectura Hexagonal**.

*   **El Dominio (`domain.model`):** Contiene el código Java puro. Aquí viven los *Records* de comandos, las entidades de dominio y los Enums (ej. `ProjectStatus`, `AppArchitecture`). No tiene ni una sola anotación de Spring o base de datos.
*   **Los Puertos (`domain.ports`):** Son interfaces puras.
    *   *Puertos de Entrada (`in`):* Definen los Casos de Uso (ej. `CreateProjectUseCase`). Es el contrato de lo que el sistema "puede hacer".
    *   *Puertos de Salida (`out`):* Definen lo que el sistema "necesita del exterior" (ej. `ProjectPersistencePort`, `ComposerEnginePort`, `DeployMessagePort`).
*   **La Aplicación (`application.service`):** Implementa los puertos de entrada. Aquí está la lógica de negocio pura (validación de cuotas, generación de nombres de namespaces). Orquesta el flujo llamando a los puertos de salida.
*   **La Infraestructura (`infrastructure.adapter`):** Implementa los puertos de salida (Adaptadores).
    *   *Adaptadores de Entrada (REST):* Los Controllers (`ProjectController`, `AdminController`) que traducen HTTP a objetos Java.
    *   *Adaptadores de Salida:* `ProjectPersistenceAdapter` (habla con JPA/Postgres), `ComposerEngineAdapter` (habla con MS-02 vía RestTemplate), `RabbitMqAdapter` (habla con RabbitMQ).

## 4. Patrones de Diseño Aplicados
1.  **Dependency Injection (Inyección de Dependencias):** Utilizado masivamente vía constructores (`@RequiredArgsConstructor` de Lombok) para acoplar los adaptadores a los servicios sin instanciarlos directamente.
2.  **Data Transfer Object (DTO):** Uso intensivo de *Records* de Java 21 para transferir datos inmutables entre la capa web y la lógica de negocio, evitando exponer las Entidades JPA (`@Entity`) directamente al cliente.
3.  **Builder Pattern:** Usado vía `@Builder` de Lombok para construir DTOs e instancias complejas de forma fluida y legible.
4.  **Facade / Orchestrator:** Los servicios (ej. `ProjectService`) actúan como fachadas que coordinan validaciones, bases de datos y mensajes a RabbitMQ en una sola transacción unificada (`@Transactional`).
5.  **Publisher-Subscriber (Event-Driven):** Implementado mediante RabbitMQ para desacoplar el tiempo de espera del usuario del tiempo real de despliegue en Kubernetes.

## 5. Modelo de Datos y Persistencia Avanzada
El diseño de la base de datos en PostgreSQL utiliza características avanzadas para cumplir con los requerimientos:
*   **Eliminación Lógica (Soft Deletes):** La tabla `projects` y `users` tienen una columna `deleted_at`. Al borrar, no se hace un `DELETE` físico, sino un `UPDATE`. Esto preserva la integridad referencial para la tabla de auditoría.
*   **Índices Parciales Condicionados:** Para permitir que un estudiante reutilice el nombre de un proyecto eliminado, se aplicó el índice: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`. Esto le enseña a Postgres a aplicar la unicidad solo en recursos "vivos".
*   **Mapeo Nativo de Enums:** Se usó `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` de Hibernate 6 para mapear los Enums de Java directamente a tipos ENUM personalizados en PostgreSQL, garantizando integridad estricta de datos a nivel de motor.
*   **Columnas JSONB:** El campo `generated_manifests` en la tabla `projects` almacena un arreglo dinámico generado por MS-02, lo que permite guardar estructuras complejas sin alterar el esquema relacional.

## 6. Seguridad y Autenticación (El Escudo)
*   **JWT en Cookies HttpOnly:** Para mitigar ataques XSS (Cross-Site Scripting), el JWT no se envía en el body de la respuesta ni se guarda en el `localStorage` de React. Se inyecta directamente como una cookie `HttpOnly` y `Secure`. El navegador la gestiona automáticamente, pero el código JavaScript no puede leerla.
*   **CORS Estricto:** Se configuró un `CorsConfigurationSource` que rechaza peticiones de cualquier origen que no sea explícitamente `http://localhost:5173`, habilitando el paso de credenciales (`allowCredentials=true`).
*   **RBAC (Role-Based Access Control):** Implementado mediante Spring Security. Las rutas `/api/admin/**` exigen interceptores que validan que el token contenga la autoridad `ROLE_ADMIN`.
*   **API Key para Microservicios:** Se creó un endpoint interno (`/api/internal/**`) protegido por una cabecera `X-Internal-API-Key` estática. Esta es una "puerta trasera segura" exclusiva para que el MS-03 pueda hacer *callbacks* y actualizar estados sin necesidad de iniciar sesión como usuario humano.

## 7. Lógica de Negocio y Flujos Clave
*   **Máquina de Estados Finita:** Los proyectos transitan estrictamente por estados definidos (`DRAFT` -> `WAITING_USER_CONFIRMATION` -> `PENDING_APPROVAL` -> `DEPLOYING` -> `DEPLOYED` / `FAILED` -> `TERMINATING` -> `TERMINATED`). No se permiten saltos ilógicos.
*   **Auditoría Inmutable (Append-Only):** Cada acción crítica (crear, aprobar, rechazar, cambiar cuotas) inserta un nuevo registro en `project_audit_logs` o `user_audit_logs`. Se diseñó como un historial inmutable que guarda al responsable, la fecha, y la razón (vital para los rechazos).
*   **Cálculo de Cuotas:** Antes de autorizar un borrador, el sistema verifica matemáticamente que los `reqCpu`, `reqMemoryMb` de los manifiestos no superen los `quotaCpuLimit` del perfil del estudiante.

## 8. Integración Inter-Servicios (Comunicación)
El MS-01 actúa como un "Hub" de comunicaciones:
1.  **Síncrona con MS-02 (Python):** Vía HTTP (`RestTemplate`). Cuando el estudiante sube un `docker-compose.yaml`, MS-01 pausa el hilo de ejecución, envía el YAML al puerto 8082, espera los manifiestos traducidos y los recursos calculados, y los guarda en la base de datos.
2.  **Asíncrona con MS-03 (Python / RabbitMQ):** Vía protocolo AMQP. Cuando un admin aprueba, MS-01 empaqueta el `projectId`, el `namespace` y los `manifests` en un JSON y lo lanza a `deploy.queue`. Hace lo mismo con `terminate.queue` al eliminar un proyecto. Esto libera inmediatamente al MS-01, logrando alta disponibilidad.

## 9. Catálogo de Endpoints Expuestos
*   **Autenticación (`/api/auth`):** `/register`, `/login`, `/logout`, `/me`, `/forgot-password`, `/reset-password`.
*   **Proyectos Estudiante (`/api/projects`):** `POST /` (Crea y Valida con MS-02), `GET /` (Lista), `GET /{id}` (Detalle), `PUT /{id}` (Redeploy), `POST /{id}/request-approval`, `DELETE /{id}`.
*   **Cuotas Estudiante (`/api/quotas`):** `POST /request`.
*   **Notificaciones (`/api/notifications`):** `GET /`, `PATCH /{id}/read`.
*   **Consola de Administrador (`/api/admin`):**
    *   `/users` (Directorio).
    *   `/projects/pending`, `/projects/{id}/approve`, `/projects/{id}/reject`.
    *   `/quotas/pending`, `/quotas/{id}/review`.
    *   `/projects/history` (Vista consolidada de auditoría).
*   **Webhooks Internos (`/api/internal`):** `/projects/{id}/status` (Usado por MS-03 para confirmar el éxito o fracaso en el clúster real).

---
