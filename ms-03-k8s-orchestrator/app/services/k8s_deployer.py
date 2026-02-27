import yaml
from kubernetes import client, utils
from kubernetes.client.rest import ApiException
from app.core.k8s_config import init_k8s_client


class KubernetesDeployerService:
    def __init__(self):
        # Inicializamos los clientes
        self.api_client, self.core_v1 = init_k8s_client()

    def create_namespace(self, namespace_name: str):
        """Crea el namespace si no existe en el clúster."""
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

    def apply_manifests(self, namespace_name: str, manifests_list: list):
        """Aplica la lista de manifiestos en el namespace indicado."""
        self.create_namespace(namespace_name)

        print(
            f"🚀 Iniciando despliegue de {len(manifests_list)} recursos en '{namespace_name}'..."
        )

        for manifest_str in manifests_list:
            try:
                # 1. Convertir el String YAML a un Diccionario de Python
                yaml_obj = yaml.safe_load(manifest_str)
                kind = yaml_obj.get("kind", "Unknown")
                name = yaml_obj.get("metadata", {}).get("name", "Unknown")

                print(f"  -> Creando {kind}: {name}...")

                # 2. Le inyectamos el namespace obligatoriamente para que no se vaya al 'default'
                if "metadata" in yaml_obj:
                    yaml_obj["metadata"]["namespace"] = namespace_name

                # 3. Aplicar en Kubernetes
                utils.create_from_dict(
                    self.api_client, yaml_obj, namespace=namespace_name
                )

            except Exception as e:
                print(f"❌ Error al crear recurso {kind} ({name}): {str(e)}")
                # Podríamos hacer un rollback aquí en el futuro
                raise e

        print(f"🎉 Despliegue completado exitosamente en '{namespace_name}'.")
