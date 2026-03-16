from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.k8s_config import init_k8s_client
import threading  # <--- IMPORTANTE
from app.consumers.deploy_consumer import start_consuming  # <--- IMPORTANTE
from app.consumers.terminate_consumer import start_terminate_consuming
from contextlib import asynccontextmanager  # <--- IMPORTANTE
from app.api.observer import router as observer_router


# Ciclo de vida de FastAPI (arrancar tareas en segundo plano)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- AL ARRANCAR ---
    print("🚀 Iniciando servicios en segundo plano...")

    print("🧵 Iniciando hilo de deploy...", flush=True)

    deploy_thread = threading.Thread(target=start_consuming, daemon=True)
    deploy_thread.start()

    print("🧵 Hilo de deploy lanzado.", flush=True)

    # Hilo 2: Destrucciones (NUEVO)
    print("🧵 Iniciando hilo de terminate...", flush=True)
    terminate_thread = threading.Thread(target=start_terminate_consuming, daemon=True)
    terminate_thread.start()

    yield  # Aquí FastAPI atiende las peticiones web

    # --- AL APAGAR ---
    print("🛑 Apagando servicios...")


app = FastAPI(
    title="PaaS K8s Orchestrator (MS-03)",
    lifespan=lifespan,  # <--- Conectamos el ciclo de vida
    description="Orquestador de infraestructura, despliegues y observabilidad",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(observer_router)

# Inicializar clientes de K8s al arrancar
try:
    api_client, core_v1 = init_k8s_client()
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
