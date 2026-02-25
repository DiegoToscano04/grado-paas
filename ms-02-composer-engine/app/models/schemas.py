from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional

# Debe coincidir exactamente con el Enum de Java (MS-01)
class AppArchitecture(str, Enum):
    DB_STANDALONE = "DB_STANDALONE"
    BACKEND_STANDALONE = "BACKEND_STANDALONE"
    FRONTEND_STANDALONE = "FRONTEND_STANDALONE"
    MONOLITH = "MONOLITH"
    BACKEND_DB = "BACKEND_DB"
    MONOLITH_DB = "MONOLITH_DB"
    THREE_TIER = "THREE_TIER"

class ComposeValidationRequest(BaseModel):
    architecture: AppArchitecture
    compose_content: str = Field(..., description="Contenido en texto del archivo docker-compose.yaml")

class ComposeValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str] =[]
    # Estos valores los calcularemos leyendo el YAML
    required_cpu: float = 0.0
    required_memory_mb: int = 0
    required_storage_mb: int = 0
    manifests: List[str] =[] # Por ahora vacío, luego pondremos los generados