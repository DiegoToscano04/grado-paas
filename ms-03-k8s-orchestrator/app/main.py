from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.k8s_config import init_k8s_client
import threading  # <--- IMPORTANTE
from app.consumers.deploy_consumer import start_consuming  # <--- IMPORTANTE
from contextlib import asynccontextmanager  # <--- IMPORTANTE


# Ciclo de vida de FastAPI (arrancar tareas en segundo plano)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- AL ARRANCAR ---
    print("🚀 Iniciando servicios en segundo plano...")
    # Lanzamos RabbitMQ en un hilo separado (daemon=True hace que se cierre si cerramos FastAPI)
    rabbitmq_thread = threading.Thread(target=start_consuming, daemon=True)
    rabbitmq_thread.start()

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
