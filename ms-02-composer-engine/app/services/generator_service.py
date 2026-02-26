import yaml
from jinja2 import Environment, FileSystemLoader
from typing import List, Tuple
import os


class ManifestGeneratorService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, "..", "templates")
        self.env = Environment(loader=FileSystemLoader(templates_dir))

        # --- DEFINICIÓN DE RECURSOS POR DEFECTO ---
        self.DEFAULTS = {
            "web": {
                "cpu_request": 250,
                "memory_request_mb": 256,
                "cpu_limit": 500,
                "memory_limit_mb": 512,
            },
            "db": {
                "cpu_request": 500,
                "memory_request_mb": 512,
                "cpu_limit": 1000,
                "memory_limit_mb": 1024,
            },
        }

    def generate(
        self, compose_content: str, architecture: str, namespace_name: str
    ) -> Tuple[List[str], float, int, int]:
        compose_dict = yaml.safe_load(compose_content)
        services = compose_dict.get("services", {})

        manifests = []
        total_cpu = 0.0
        total_memory_mb = 0
        total_storage_mb = 0

        for service_name, service_config in services.items():
            labels = service_config.get("labels", {})

            # 1. Determinar el tipo de servicio para los defaults
            service_type = "db" if service_name == "db" else "web"

            # 2. Leer recursos de los labels o usar defaults
            cpu_request = int(
                labels.get(
                    "paas.cpu_request_m", self.DEFAULTS[service_type]["cpu_request"]
                )
            )
            memory_request_mb = int(
                labels.get(
                    "paas.memory_request_mb",
                    self.DEFAULTS[service_type]["memory_request_mb"],
                )
            )
            cpu_limit = int(
                labels.get("paas.cpu_limit_m", self.DEFAULTS[service_type]["cpu_limit"])
            )
            memory_limit_mb = int(
                labels.get(
                    "paas.memory_limit_mb",
                    self.DEFAULTS[service_type]["memory_limit_mb"],
                )
            )

            # 3. Sumar a los totales
            total_cpu += cpu_request / 1000.0
            total_memory_mb += memory_request_mb

            # --- Lógica de extracción de image, port, environment que ya funcionaba ---
            image = service_config.get("image")
            env_dict = {}
            environments = service_config.get("environment", {})
            if isinstance(environments, dict):
                env_dict = environments
            elif isinstance(environments, list):
                for env_var in environments:
                    if "=" in env_var:
                        k, v = env_var.split("=", 1)
                        env_dict[k] = v

            container_port = None
            ports_config = service_config.get("ports", [])
            if ports_config:
                port_str = str(ports_config[0])
                if ":" in port_str:
                    container_port = int(port_str.split(":")[-1])
                else:
                    container_port = int(port_str)

            # --- Construcción del diccionario de datos para Jinja2 (una sola vez) ---
            template_data = {
                "service_name": service_name,
                "image": image,
                "container_port": container_port,
                "namespace_name": namespace_name,
                "environments": env_dict,
                "has_environments": len(env_dict) > 0,
                "cpu_request": cpu_request,
                "memory_request_mb": memory_request_mb,
                "cpu_limit": cpu_limit,
                "memory_limit_mb": memory_limit_mb,
            }

            if template_data["has_environments"]:
                cm_template = self.env.get_template("configmap.yaml.j2")
                manifests.append(cm_template.render(template_data))

            # --- Lógica de generación de manifiestos ---
            if service_name in ["back", "front", "monolith"]:
                deploy_template = self.env.get_template("deployment.yaml.j2")
                manifests.append(
                    deploy_template.render(template_data)
                )  # <-- La corrección clave

                if container_port:
                    template_data["service_type"] = "ClusterIP"
                    svc_template = self.env.get_template("service.yaml.j2")
                    manifests.append(svc_template.render(template_data))

                    host_name = f"{service_name}-{namespace_name}.apps.lab.edu.co"
                    template_data["host_name"] = host_name
                    ingress_template = self.env.get_template("ingress.yaml.j2")
                    manifests.append(ingress_template.render(template_data))

            elif service_name == "db":
                storage_mb = int(labels.get("paas.storage_size_mb", 1024))
                total_storage_mb += storage_mb
                template_data["storage_mb"] = storage_mb

                mount_path = "/var/lib/data"
                if "postgres" in image.lower():
                    mount_path = "/var/lib/postgresql/data"
                elif "mysql" in image.lower():
                    mount_path = "/var/lib/mysql"
                template_data["mount_path"] = mount_path

                pvc_template = self.env.get_template("pvc.yaml.j2")
                manifests.append(pvc_template.render(template_data))

                sts_template = self.env.get_template("statefulset.yaml.j2")
                manifests.append(
                    sts_template.render(template_data)
                )  # <-- La corrección clave

                if container_port:
                    if architecture == "DB_STANDALONE":
                        template_data["service_type"] = "NodePort"
                    else:
                        template_data["service_type"] = "ClusterIP"
                    svc_template = self.env.get_template("service.yaml.j2")
                    manifests.append(svc_template.render(template_data))

        return manifests, total_cpu, total_memory_mb, total_storage_mb
