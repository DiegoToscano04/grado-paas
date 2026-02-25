import yaml
from jinja2 import Environment, FileSystemLoader
from typing import Dict, Any, List
import os


class ManifestGeneratorService:
    def __init__(self):
        # Configuramos Jinja2 para que busque en la carpeta app/templates
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, "..", "templates")
        self.env = Environment(loader=FileSystemLoader(templates_dir))

    def generate(
        self, compose_content: str, architecture: str, namespace: str = "default"
    ) -> List[str]:
        compose_dict = yaml.safe_load(compose_content)
        services = compose_dict.get("services", {})

        manifests = []

        for service_name, service_config in services.items():
            image = service_config.get("image")

            # Extraer puerto
            container_port = None
            ports_config = service_config.get("ports", [])
            if ports_config:
                port_str = str(ports_config[0])
                if ":" in port_str:
                    container_port = int(port_str.split(":")[-1])
                else:
                    container_port = int(port_str)

            # Datos base para Jinja2
            template_data = {
                "service_name": service_name,
                "image": image,
                "container_port": container_port,
                "namespace": namespace,
            }

            # ---------------------------------------------------------
            # LÓGICA PARA COMPONENTES WEB (back, front, monolith)
            # ---------------------------------------------------------
            if service_name in ["back", "front", "monolith"]:
                deploy_template = self.env.get_template("deployment.yaml.j2")
                manifests.append(deploy_template.render(template_data))

                if container_port:
                    svc_template = self.env.get_template("service.yaml.j2")
                    manifests.append(svc_template.render(template_data))

            # ---------------------------------------------------------
            # LÓGICA PARA BASES DE DATOS (db) - RF-030 y RF-031
            # ---------------------------------------------------------
            elif service_name == "db":
                # 1. Obtenemos el tamaño del storage de los labels (RF-032)
                # Si el usuario no lo pone, asumimos 1024MB (1GB) por defecto
                labels = service_config.get("labels", {})
                storage_mb = labels.get("paas.storage_size_mb", 1024)

                # Intentamos adivinar la ruta de montaje según la imagen
                mount_path = "/var/lib/data"
                if "postgres" in image.lower():
                    mount_path = "/var/lib/postgresql/data"
                elif "mysql" in image.lower():
                    mount_path = "/var/lib/mysql"
                elif "mongo" in image.lower():
                    mount_path = "/data/db"

                template_data["storage_mb"] = storage_mb
                template_data["mount_path"] = mount_path

                # Generamos PVC, StatefulSet y Service
                pvc_template = self.env.get_template("pvc.yaml.j2")
                manifests.append(pvc_template.render(template_data))

                sts_template = self.env.get_template("statefulset.yaml.j2")
                manifests.append(sts_template.render(template_data))

                if container_port:
                    svc_template = self.env.get_template("service.yaml.j2")
                    # Para Standalone DB (RF-026) luego haremos que el Service sea NodePort.
                    # Por ahora todos son ClusterIP.
                    manifests.append(svc_template.render(template_data))

        return manifests
