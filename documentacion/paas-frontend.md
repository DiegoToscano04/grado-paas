
---

# INFORME TÉCNICO DETALLADO: FRONTEND (React SPA)
**Nombre del Componente:** `paas-frontend` (Interfaz de Usuario y Consola de Gestión)
**Rol en el Sistema:** Punto de interacción principal para Estudiantes y Administradores. Actúa como cliente consumidor de las APIs (MS-01 y MS-03), gestiona la experiencia de usuario (UX), el estado global de la sesión y la visualización en tiempo real de la telemetría del clúster.

## 1. Visión General
El Frontend es una Single Page Application (SPA) moderna que unifica dos portales completamente distintos bajo una misma base de código: el **Portal Educativo del Estudiante** (enfocado en laboratorios, editores de código y observabilidad) y la **Consola del Administrador** (enfocada en directorios, auditoría y revisión de recursos). Su diseño prioriza la claridad visual (Glassmorphism, Dark/Light modes contextuales) y la reactividad, ocultando la inmensa complejidad de Kubernetes detrás de asistentes (Wizards) intuitivos.

## 2. Stack Tecnológico y Herramientas
*   **Core Framework:** React 18+ empaquetado con Vite (Elegido por su Hot Module Replacement -HMR- ultrarrápido y compilación optimizada con esbuild/Rollup).
*   **Lenguaje:** TypeScript (Aporta tipado estático estricto, garantizando que los contratos de datos/DTOs enviados por Java y Python se respeten en la interfaz, evitando errores en tiempo de ejecución).
*   **Estilos y UI:** Tailwind CSS (Framework *Utility-First* para un diseño a medida y pixel-perfect). Uso de `clsx` y `tailwind-merge` para la concatenación dinámica y segura de clases CSS.
*   **Gestor de Estado Global:** Zustand (Alternativa moderna y ligera a Redux, ideal para manejar la sesión del usuario y la persistencia de estados entre vistas sin exceso de *boilerplate*).
*   **Data Fetching & Caché:** TanStack Query / React Query (El estándar actual para sincronización de estado del servidor. Maneja el caché, reintentos automáticos, y el *Polling* en segundo plano).
*   **Enrutamiento:** React Router DOM v6 (Gestión de rutas del lado del cliente con protección basada en roles).
*   **Librerías Clave:** `@monaco-editor/react` (Motor de VS Code integrado para edición y visualización de YAML), `lucide-react` (Iconografía vectorial), `react-hot-toast` (Sistema de notificaciones no bloqueantes).

## 3. Arquitectura de Software y Estructura de Carpetas
Se implementó una arquitectura basada en características (*Feature-based*) y separación de responsabilidades:
*   `src/api/`: Configuración del cliente HTTP (Axios) con interceptores para inyección de credenciales y manejo global de errores (ej. expiración de sesión 401/403). Se configuraron dos instancias (`api` para MS-01 y `apiK8s` para MS-03).
*   `src/components/ui/`: Componentes base reutilizables y "tontos" (Dumb Components) como Buttons, Inputs, Badges y Avatars.
*   `src/components/shared/`: Componentes compartidos entre flujos (ej. `NotificationMenu`, `Navbar`).
*   `src/components/dashboard/`: Componentes complejos y "conectados" (Smart Components) específicos del negocio, como `CreateProjectWizard`, `ManifestExplorer` y `AdminProjectReview`.
*   `src/pages/`: Las vistas principales enrutables (Landing, Login, Register, StudentDashboard, AdminDashboard).
*   `src/store/`: Definición de los almacenes de Zustand (`useAuthStore`, `useProjectStore`).
*   `src/data/`: Diccionarios estáticos de conocimiento (ej. `manifestGuides.ts` para la plataforma educativa).

## 4. Estrategias de UX/UI y Patrones de Diseño
1.  **Desktop-First Approach:** Dado que la plataforma es una herramienta de infraestructura avanzada (IDE embebido, lectura de logs de consola, revisión de YAMLs), se tomó la decisión arquitectónica de priorizar resoluciones de escritorio, alineándose con los estándares de la industria cloud (AWS Console, GCP).
2.  **Focus Mode (Wizard Takeover):** Para tareas cognitivamente pesadas como la configuración de un nuevo despliegue, el componente `CreateProjectWizard` oculta la navegación global y toma el control total de la pantalla, reduciendo la fricción y previniendo salidas accidentales.
3.  **Skeleton Screens & Spinners:** Uso de `Loader2` de Lucide y estados condicionales (`isLoading`) para proveer retroalimentación visual inmediata durante las transiciones de red asíncronas.
4.  **Feedback Loop Cerrado:** Uso de `react-hot-toast` acoplado a las mutaciones de Axios para informar al usuario del éxito o fracaso exacto de cada acción de negocio.

## 5. Gestión de Estado y Sincronización (React Query)
El frontend abandona el tradicional `useEffect` para el consumo de APIs a favor de **TanStack Query**, logrando capacidades de grado empresarial:
*   **Invalidación de Caché Inteligente:** Cuando un Administrador aprueba un proyecto o un Estudiante elimina uno, el frontend ejecuta `queryClient.invalidateQueries()`. Esto fuerza una recarga en segundo plano instantánea de la barra lateral y los directorios, manteniendo la UI sincronizada sin recargar el navegador.
*   **Short Polling Estratégico:** Para resolver el problema de la comunicación asíncrona de RabbitMQ y Kubernetes, componentes como el `AdminDashboard` (solicitudes pendientes) y el `NotificationMenu` ejecutan un *refetchInterval*. Esto permite que los cambios de estado (ej. de `DEPLOYING` a `DEPLOYED`) aparezcan mágicamente en pantalla.
*   **Streaming Simulado de Logs:** El componente de detalles del proyecto realiza peticiones HTTP cada 3 segundos (`refetchInterval: 3000`) al MS-03, extrayendo el `stdout` de los contenedores para emular una conexión de terminal en vivo.

## 6. Seguridad Frontend y Enrutamiento (RBAC)
*   **Gestión de Cookies Seguras:** El cliente de Axios está configurado con `withCredentials: true`. El frontend nunca almacena ni manipula el JWT manualmente (mitigando ataques XSS). El navegador adjunta la cookie `HttpOnly` en cada petición automáticamente.
*   **Route Guards (Guardianes de Ruta):** Se implementaron componentes de orden superior (`<StudentRoute>` y `<AdminRoute>`) en `App.tsx`. Estos verifican el estado de autenticación en Zustand y el `user.role`. Si un estudiante intenta navegar manualmente a `/admin`, el guardián intercepta la ruta y lo expulsa hacia su propio dashboard, garantizando separación de privilegios a nivel de UI.

## 7. Lógica Core: El Explorador de Manifiestos y la Educación
Una de las piezas de ingeniería más complejas del Frontend es el `ManifestExplorer`.
*   **Parseo Dinámico en Cliente:** Recibe un arreglo de Strings (YAML puro) desde Java, lo divide por líneas (`split('\n')`), extrae las llaves `kind:` y `name:` mediante expresiones regulares/búsquedas, y construye un árbol de archivos virtual clasificado lógicamente (Database, Backend, Security, Networking).
*   **Motor Educativo Integrado:** Al seleccionar un archivo, el frontend no solo renderiza el Monaco Editor en modo lectura, sino que cruza el `kind` del manifiesto con un diccionario estático interno (`manifestGuides.ts`). Esto renderiza dinámicamente guías explicativas estructuradas (Qué es, Parámetros clave y Notas de Arquitectura) cumpliendo el núcleo del propósito pedagógico de la tesis.

## 8. Lógica Core: Consola de Administración
Diseñada para la eficiencia del administrador, implementa:
*   **Filtros Multidimensionales (Client-Side):** Las búsquedas de estudiantes y proyectos se realizan en la memoria del navegador (`Array.filter()`), cruzando datos de namespaces con códigos de estudiantes en tiempo real sin latencia de red.
*   **Paginación Lógica:** Manejo de índices (`slice`) para renderizar tablas de datos manejables y ligeras en el DOM.
*   **Historial y Auditoría Visual:** Consumo del endpoint consolidado de historial, mapeando los registros de auditoría a una línea de tiempo visual que muestra insignias de "Aprobado/Rechazado", el profesor responsable y el motivo exacto, garantizando trazabilidad absoluta desde la interfaz gráfica.

---
