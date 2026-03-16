import yaml
import subprocess
import logging
from kubernetes import client
from kubernetes.client.rest import ApiException
from app.core.k8s_config import init_k8s_client

logger = logging.getLogger(__name__)


class KubernetesDeployerService:
    def __init__(self):
        # Cuando se llama a init_k8s_client, los mensajes de conexión se imprimen solos
        self.api_client, self.core_v1 = init_k8s_client()

    def create_namespace(self, namespace_name: str):
        try:
            self.core_v1.read_namespace(name=namespace_name)
            logger.info(f"ℹ️ Namespace '{namespace_name}' ya existe.")
        except ApiException as e:
            if e.status == 404:
                logger.info(f"🔨 Creando Namespace '{namespace_name}'...")
                ns_metadata = client.V1ObjectMeta(name=namespace_name)
                ns_body = client.V1Namespace(metadata=ns_metadata)
                self.core_v1.create_namespace(body=ns_body)
                logger.info(f"✅ Namespace creado.")
            else:
                raise e

    def delete_namespace(self, namespace_name: str):
        try:
            logger.info(
                f"🗑️ Eliminando Namespace '{namespace_name}' y todos sus recursos..."
            )
            self.core_v1.delete_namespace(name=namespace_name)
            logger.info(
                f"✅ Orden de eliminación enviada a Kubernetes para '{namespace_name}'."
            )
        except ApiException as e:
            if e.status == 404:
                logger.info(
                    f"ℹ️ El Namespace '{namespace_name}' no existe, asumiendo como ya eliminado."
                )
            else:
                raise e

    def apply_manifests(self, namespace_name: str, manifests_list: list):
        self.create_namespace(namespace_name)
        logger.info(
            f"🚀 Iniciando despliegue DECLARATIVO de {len(manifests_list)} recursos..."
        )

        full_yaml = "\n---\n".join(manifests_list)

        try:
            process = subprocess.run(
                ["kubectl", "apply", "-n", namespace_name, "-f", "-"],
                input=full_yaml.encode("utf-8"),
                capture_output=True,
                check=True,
                timeout=30,
            )
            logger.info(f"✅ K8s respondió:\n{process.stdout.decode('utf-8')}")

        except subprocess.TimeoutExpired:
            error_msg = (
                "TIMEOUT: El comando kubectl se quedó congelado por más de 30 segundos."
            )
            logger.error(f"❌ {error_msg}")
            raise Exception(error_msg)
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode("utf-8")
            logger.error(f"❌ Error de K8s: {error_msg}")
            raise Exception(f"Fallo en kubectl apply: {error_msg}")
