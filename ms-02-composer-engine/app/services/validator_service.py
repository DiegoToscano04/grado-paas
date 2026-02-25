import yaml
from typing import Dict, Any, List, Set, Tuple
from app.models.schemas import AppArchitecture

class ComposeValidatorService:
    # Definimos el Contrato Estricto (RF-016, RF-017)
    ARCHITECTURE_CONTRACTS: Dict[AppArchitecture, Set[str]] = {
        AppArchitecture.DB_STANDALONE: {"db"},
        AppArchitecture.BACKEND_STANDALONE: {"back"},
        AppArchitecture.FRONTEND_STANDALONE: {"front"},
        AppArchitecture.MONOLITH: {"monolith"},
        AppArchitecture.BACKEND_DB: {"back", "db"},
        AppArchitecture.MONOLITH_DB: {"monolith", "db"},
        AppArchitecture.THREE_TIER: {"front", "back", "db"}
    }

    # Elementos permitidos a nivel de servicio (RF-012, RF-013)
    ALLOWED_SERVICE_KEYS = {"image", "ports", "environment", "volumes", "labels", "container_name", "command", "depends_on"}

    def validate(self, compose_content: str, architecture: AppArchitecture) -> Tuple[bool, List[str]]:
        errors =[]

        # 1. Validación Sintáctica (RF-011)
        try:
            compose_dict = yaml.safe_load(compose_content)
            if not isinstance(compose_dict, dict):
                return False, ["El archivo YAML no tiene un formato válido de diccionario en la raíz."]
        except yaml.YAMLError as e:
            return False, [f"Error de sintaxis YAML: {str(e)}"]

        if "services" not in compose_dict:
            return False,["El archivo debe contener el bloque principal 'services'."]

        services: Dict[str, Any] = compose_dict.get("services", {})
        
        if not isinstance(services, dict) or not services:
            return False,["El bloque 'services' está vacío o no es válido."]

        # 2. Validación de Contrato Estricto (RF-016, RF-017)
        expected_services = self.ARCHITECTURE_CONTRACTS[architecture]
        actual_services = set(services.keys())

        if expected_services != actual_services:
            missing = expected_services - actual_services
            extra = actual_services - expected_services
            if missing:
                errors.append(f"Faltan los siguientes servicios requeridos para {architecture.name}: {', '.join(missing)}")
            if extra:
                errors.append(f"Servicios no permitidos encontrados: {', '.join(extra)}. Solo se permiten: {', '.join(expected_services)}")
            return False, errors # Si el contrato falla, detenemos aquí

        # 3. Validación de Atributos y Reglas Internas (RF-012, RF-013, RF-018)
        for service_name, service_config in services.items():
            if not isinstance(service_config, dict):
                errors.append(f"La configuración del servicio '{service_name}' no es válida.")
                continue

            # a. Verificar claves no permitidas
            actual_keys = set(service_config.keys())
            forbidden_keys = actual_keys - self.ALLOWED_SERVICE_KEYS
            if forbidden_keys:
                errors.append(f"El servicio '{service_name}' contiene configuraciones no permitidas: {', '.join(forbidden_keys)}.")

            if "build" in actual_keys:
                errors.append(f"No se permite construir imágenes ('build' en '{service_name}'). Usa imágenes de DockerHub.")

            # b. Verificar imagen obligatoria
            if "image" not in actual_keys:
                errors.append(f"El servicio '{service_name}' debe definir una 'image'.")

            # c. Verificar puertos expuestos para componentes Web (RF-018)
            is_web_component = service_name in {"front", "back", "monolith"}
            if is_web_component and "ports" not in actual_keys:
                errors.append(f"El servicio web '{service_name}' debe exponer al menos un puerto ('ports').")

        is_valid = len(errors) == 0
        return is_valid, errors

    def extract_resources(self, compose_content: str) -> Tuple[float, int, int]:
        """
        Extrae o calcula los recursos. Por ahora retornamos valores base.
        (En una fase posterior leeremos los labels RF-032).
        """
        return 0.5, 512, 1024 # CPU, RAM(MB), Storage(MB)