import yaml
import subprocess
from kubernetes import client
from kubernetes.client.rest import ApiException
from app.core.k8s_config import init_k8s_client


class KubernetesDeployerService:
    def __init__(self):
        self.api_client, self.core_v1 = init_k8s_client()

    def create_namespace(self, namespace_name: str):
        try:
            self.core_v1.read_namespace(name=namespace_name)
            print(f"ℹ️ El Namespace '{namespace_name}' ya existe.")
        except ApiException as e:
            if e.status == 404:
                print(f"🔨 Creando Namespace '{namespace_name}'...")
                ns_metadata = client.V1ObjectMeta(name=namespace_name)
                ns_body = client.V1Namespace(metadata=ns_metadata)
                self.core_v1.create_namespace(body=ns_body)
                print(f"✅ Namespace creado.")
            else:
                raise e

    def delete_namespace(self, namespace_name: str):
        try:
            print(f"🗑️ Eliminando Namespace '{namespace_name}' y todos sus recursos...")
            self.core_v1.delete_namespace(name=namespace_name)
            print(f"✅ Orden de eliminación enviada a Kubernetes.")
        except ApiException as e:
            if e.status == 404:
                print(f"ℹ️ El Namespace no existe, asumiendo como eliminado.")
            else:
                raise e

    def apply_manifests(self, namespace_name: str, manifests_list: list):
        self.create_namespace(namespace_name)
        print(
            f"🚀 Iniciando despliegue DECLARATIVO de {len(manifests_list)} recursos en '{namespace_name}'..."
        )

        # Unimos todos los manifiestos en un solo gran archivo YAML de texto
        full_yaml = "\n---\n".join(manifests_list)

        try:
            # MAGIA DEVOPS: Usamos el comando nativo "apply" de Kubernetes
            # Esto soluciona los errores 409 y hace actualizaciones inteligentes (Rolling Updates)
            process = subprocess.run(
                ["kubectl", "apply", "-n", namespace_name, "-f", "-"],
                input=full_yaml.encode("utf-8"),
                capture_output=True,
                check=True,
            )
            print("Resultado de K8s:\n" + process.stdout.decode("utf-8"))
            print(f"🎉 Despliegue/Actualización completada exitosamente.")

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode("utf-8")
            print(f"❌ Error crítico de Kubernetes: {error_msg}")
            raise Exception(f"Fallo en kubectl apply: {error_msg}")
