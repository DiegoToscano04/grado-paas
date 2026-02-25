from fastapi import APIRouter, HTTPException
from app.models.schemas import ComposeValidationRequest, ComposeValidationResponse
from app.services.validator_service import ComposeValidatorService
from app.services.generator_service import ManifestGeneratorService # <--- NUEVO

router = APIRouter(prefix="/api/composer", tags=["Composer Engine"])
validator_service = ComposeValidatorService()
generator_service = ManifestGeneratorService() # <--- NUEVO


@router.post("/validate", response_model=ComposeValidationResponse)
def validate_compose(request: ComposeValidationRequest):
    # 1. Ejecutar validación
    is_valid, errors = validator_service.validate(request.compose_content, request.architecture)
    
    # 2. Si hay errores, retornar inmediato
    if not is_valid:
        return ComposeValidationResponse(
            is_valid=False,
            errors=errors
        )
    
    # 3. Si es válido, extraer/calcular recursos
    # Nota: El bloque try/except previene errores si el string ya fue validado
    cpu, memory_mb, storage_mb = validator_service.extract_resources(request.compose_content)

    # <--- NUEVO: Generar manifiestos si es válido
    generated_manifests = generator_service.generate(request.compose_content, request.architecture)

    # 4. Retornar éxito
    return ComposeValidationResponse(
        is_valid=True,
        errors=[],
        required_cpu=cpu,
        required_memory_mb=memory_mb,
        required_storage_mb=storage_mb,
        manifests=generated_manifests # <--- Enviamos los manifiestos reales

    )