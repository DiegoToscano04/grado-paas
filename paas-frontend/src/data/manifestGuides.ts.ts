export const MANIFEST_GUIDES: Record<string, any> = {
    'StatefulSet': {
        title: 'Entendiendo el StatefulSet',
        whatIsIt: 'Un StatefulSet es el objeto de Kubernetes diseñado para manejar aplicaciones que necesitan mantener su estado (datos), como las bases de datos. A diferencia de un Deployment convencional, garantiza que el nombre del Pod y su almacenamiento sean persistentes y predecibles.',
        params: [
            { name: 'serviceName', desc: 'Define el nombre del servicio que controla la identidad de red de los Pods. Es vital para que el backend encuentre la base de datos por su nombre.' },
            { name: 'replicas: 1', desc: 'Para bases de datos en entornos educativos, usamos una sola réplica para evitar conflictos complejos de escritura simultánea en disco (Split-Brain).' },
            { name: 'volumeMounts', desc: 'Aquí le decimos al contenedor en qué carpeta interna debe inyectar el disco duro virtual para que la información no se borre al reiniciar.' }
        ],
        note: 'En esta plataforma, hemos asociado este StatefulSet a un StorageClass hostPath. Esto significa que los datos se guardan físicamente en una carpeta del nodo del clúster. Es ideal para aprender, pero en la nube usarías discos como AWS EBS.'
    },
    'Deployment': {
        title: 'Entendiendo el Deployment',
        whatIsIt: 'El Deployment es el recurso más común en Kubernetes. Se utiliza para aplicaciones "Stateless" (sin estado), como tu Frontend o tu API Backend. Se encarga de mantener viva la cantidad exacta de réplicas que pidas y facilita las actualizaciones sin tiempo de inactividad.',
        params: [
            { name: 'replicas', desc: 'Define cuántas copias idénticas de tu contenedor estarán corriendo. Si una falla, Kubernetes levanta otra automáticamente.' },
            { name: 'image', desc: 'La dirección de DockerHub de donde Kubernetes descargará el código de tu aplicación.' },
            { name: 'envFrom', desc: 'Inyecta las variables de entorno de forma segura leyendo el ConfigMap que generamos a partir de tu docker-compose.' }
        ],
        note: 'Como tu aplicación no guarda datos críticos en su propia memoria, Kubernetes puede destruir y recrear este Pod en cualquier servidor en cualquier momento sin perder información.'
    },
    'Service': {
        title: 'Entendiendo el Service',
        whatIsIt: 'En Kubernetes, los Pods nacen y mueren todo el tiempo, cambiando de dirección IP. El Service actúa como un "Balanceador de Carga Interno" y un directorio telefónico fijo. Le da a tus Pods una IP estática y un nombre de dominio interno.',
        params: [
            { name: 'selector', desc: 'Es el "imán" del servicio. Busca todos los Pods que tengan la etiqueta (label) especificada y les envía el tráfico.' },
            { name: 'type: ClusterIP', desc: 'Significa que este servicio solo es accesible desde adentro del clúster. Es la configuración más segura para evitar hackeos directos.' },
            { name: 'type: NodePort', desc: 'Expone el puerto de la base de datos directamente en la IP física del servidor. Útil para que te conectes con DBeaver o pgAdmin.' }
        ],
        note: 'Gracias al Service, tu Backend no necesita saber la IP exacta de tu Base de Datos, solo necesita conectarse a la URL interna "db-svc".'
    },
    'NetworkPolicy': {
        title: 'Entendiendo la NetworkPolicy',
        whatIsIt: 'Es el Firewall (CortaFuegos) interno de Kubernetes. Por defecto, en K8s todos pueden hablar con todos. Las NetworkPolicies aplican la filosofía de "Zero Trust" (Confianza Cero), bloqueando el tráfico no autorizado.',
        params: [
            { name: 'podSelector', desc: 'Define a qué contenedor se le aplicará esta regla de seguridad.' },
            { name: 'ingress', desc: 'Define las reglas para el tráfico ENTRANTE. Si está vacío, significa "Bloquear Todo" (Default Deny).' },
            { name: 'from', desc: 'Especifica explícitamente quién tiene permiso de entrar. Por ejemplo, permitir que solo el Backend hable con la Base de Datos.' }
        ],
        note: 'La plataforma generó estas reglas automáticamente leyendo tu arquitectura. Esto garantiza que otro estudiante en el mismo servidor no pueda acceder a tu base de datos.'
    },
    'Ingress': {
        title: 'Entendiendo el Ingress',
        whatIsIt: 'El Ingress es la puerta de entrada principal desde Internet hacia tu clúster. Es un proxy inverso (usualmente NGINX) que lee la URL que el usuario escribió en el navegador y decide a qué Service interno debe enviar la petición.',
        params: [
            { name: 'host', desc: 'La URL pública que se le asignó a tu proyecto (ej. miservicio.apps.uislab.cloud).' },
            { name: 'backend', desc: 'Le indica al Ingress a qué Service interno y a qué puerto debe mandar el tráfico de los visitantes.' }
        ],
        note: 'Para que esto funcione, el administrador de redes de la universidad configuró un DNS Wildcard (*.apps) apuntando a los servidores físicos.'
    }
};