from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.composer import router as composer_router # <--- Importar el router

app = FastAPI(
    title="PaaS Composer Engine (MS-02)",
    description="Motor de validación y traducción de Docker Compose a Kubernetes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar las rutas
app.include_router(composer_router) # <--- Registrar el router

@app.get("/health")
def health_check():
    return {"status": "Composer Engine is running properly"}