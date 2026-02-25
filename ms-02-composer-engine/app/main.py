from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PaaS Composer Engine (MS-02)",
    description="Motor de validación y traducción de Docker Compose a Kubernetes",
    version="1.0.0"
)

# Permitir CORS (para cuando lo llamemos desde otros lados, aunque principalmente será llamado por MS-01)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "Composer Engine is running properly"}