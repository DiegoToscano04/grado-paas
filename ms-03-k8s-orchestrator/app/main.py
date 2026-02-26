from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.k8s_config import init_k8s_client

app = FastAPI(
    title="PaaS K8s Orchestrator (MS-03)",
    description="Orquestador de infraestructura, despliegues y observabilidad",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar clientes de K8s al arrancar
try:
    core_v1, apps_v1, networking_v1 = init_k8s_client()
except Exception as e:
    print("El orquestador arrancó, pero K8s no está disponible.")


@app.get("/health")
def health_check():
    # Pequeña prueba: le preguntamos a K8s cuántos namespaces tiene
    try:
        namespaces = core_v1.list_namespace()
        ns_count = len(namespaces.items)
        return {
            "status": "Orchestrator is running",
            "k8s_connection": "OK",
            "namespaces_count": ns_count,
        }
    except Exception as e:
        return {
            "status": "Orchestrator is running",
            "k8s_connection": f"FAILED: {str(e)}",
        }
