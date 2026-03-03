from fastapi import APIRouter, HTTPException
from app.services.k8s_observer import KubernetesObserverService

router = APIRouter(prefix="/api/k8s", tags=["Observability"])
observer_service = KubernetesObserverService()


@router.get("/{namespace_name}/status")
def get_project_status(namespace_name: str):
    """Devuelve la lista de pods y su estado actual."""
    try:
        pods = observer_service.get_namespace_status(namespace_name)
        return {"namespace": namespace_name, "pods": pods}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{namespace_name}/logs/{pod_name}")
def get_container_logs(namespace_name: str, pod_name: str):
    """Devuelve los logs de un pod específico."""
    try:
        logs = observer_service.get_pod_logs(namespace_name, pod_name)
        return {"namespace": namespace_name, "pod_name": pod_name, "logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
