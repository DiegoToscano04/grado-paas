from kubernetes import client
from kubernetes.client.rest import ApiException
from app.core.k8s_config import init_k8s_client


class KubernetesObserverService:
    def __init__(self):
        # Para leer, solo necesitamos el core_v1
        _, self.core_v1 = init_k8s_client()

    def get_namespace_status(self, namespace_name: str) -> list:
        """Obtiene el estado de todos los pods en un namespace."""
        try:
            pods = self.core_v1.list_namespaced_pod(namespace=namespace_name)

            pod_list = []
            for pod in pods.items:
                # Calcular reinicios de forma segura
                restarts = 0
                if pod.status.container_statuses:
                    restarts = sum(
                        c.restart_count for c in pod.status.container_statuses
                    )

                pod_info = {
                    "name": pod.metadata.name,
                    "phase": pod.status.phase,  # Running, Pending, Failed, etc.
                    "pod_ip": pod.status.pod_ip,
                    "restarts": restarts,
                    "created_at": pod.metadata.creation_timestamp.isoformat()
                    if pod.metadata.creation_timestamp
                    else None,
                }
                pod_list.append(pod_info)

            return pod_list
        except ApiException as e:
            if e.status == 404:
                return []  # Si el namespace no existe (aún), devolvemos lista vacía
            raise Exception(f"Error al obtener pods: {str(e)}")

    def get_pod_logs(
        self, namespace_name: str, pod_name: str, tail_lines: int = 200
    ) -> str:
        """Obtiene los últimos X logs de un pod específico."""
        try:
            # tail_lines asegura que no descarguemos gigas de logs, solo las últimas 200 líneas
            logs = self.core_v1.read_namespaced_pod_log(
                name=pod_name, namespace=namespace_name, tail_lines=tail_lines
            )
            return logs
        except ApiException as e:
            return f"No se pudieron obtener los logs (El contenedor puede estar creándose o fallando): {str(e)}"
