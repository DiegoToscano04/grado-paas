import yaml
from jinja2 import Environment, FileSystemLoader
from typing import Dict, Any, List
import os

class ManifestGeneratorService:
    def __init__(self):
        # Configuramos Jinja2 para que busque en la carpeta app/templates
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, '..', 'templates')
        self.env = Environment(loader=FileSystemLoader(templates_dir))

    def generate(self, compose_content: str, architecture: str) -> List[str]:
        compose_dict = yaml.safe_load(compose_content)
        services = compose_dict.get("services", {})
        
        manifests =[]

        for service_name, service_config in services.items():
            # 1. Extraer la imagen
            image = service_config.get("image")
            
            # 2. Extraer el puerto (Simplificado por ahora: toma el primer puerto)
            # Los puertos en compose suelen venir como "8080:80" (host:container) o "80"
            container_port = None
            ports_config = service_config.get("ports",[])
            if ports_config:
                port_str = str(ports_config[0])
                if ":" in port_str:
                    container_port = int(port_str.split(":")[-1]) # Toma el de la derecha
                else:
                    container_port = int(port_str)

            # 3. Datos a inyectar en la plantilla
            template_data = {
                "service_name": service_name,
                "image": image,
                "container_port": container_port
            }

            # 4. Generar Deployment
            if service_name in["back", "front", "monolith"]:
                deploy_template = self.env.get_template("deployment.yaml.j2")
                manifests.append(deploy_template.render(template_data))
                
                # Generar Service si tiene puerto
                if container_port:
                    svc_template = self.env.get_template("service.yaml.j2")
                    manifests.append(svc_template.render(template_data))

            # TODO: Más adelante agregaremos la lógica para bases de datos (StatefulSet) e Ingress.

        return manifests