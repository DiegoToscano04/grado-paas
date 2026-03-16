import json
import pika
import requests
import os
import logging
import sys
from app.core.rabbitmq_config import get_rabbitmq_connection
from app.services.k8s_deployer import KubernetesDeployerService

# --- CONFIGURACIÓN DE LOGS PROFESIONALES ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

QUEUE_NAME = "deploy.queue"
MS01_URL = os.getenv(
    "MS01_URL",
    "http://ms01-svc.plataforma-web.svc.cluster.local:8081/api/internal/projects",
)
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "super-secret-internal-key-123")

deployer_service = KubernetesDeployerService()


def notify_ms01(project_id: str, status: str, message: str):
    try:
        url = f"{MS01_URL}/{project_id}/status"
        headers = {
            "Content-Type": "application/json",
            "X-Internal-API-Key": INTERNAL_API_KEY,
        }
        payload = {"status": status, "message": message}

        logger.info(f"📡 Intentando notificar a MS-01 en {url} con estado: {status}")
        response = requests.patch(url, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            logger.info(f"✅ MS-01 notificado exitosamente.")
        else:
            logger.error(
                f"⚠️ Error de MS-01 (Status {response.status_code}): {response.text}"
            )
    except requests.exceptions.Timeout:
        logger.error(f"⚠️ TIMEOUT: MS-01 no respondió después de 10 segundos en {url}")
    except Exception as e:
        logger.error(f"⚠️ Fallo de red crítico al notificar a MS-01: {e}")


def on_message_received(ch, method, properties, body):
    try:
        message = json.loads(body)
        project_id = message.get("projectId")
        namespace = message.get("namespaceName")
        manifests = message.get("manifests", [])

        logger.info(f"==================================================")
        logger.info(f"📥 NUEVO DESPLIEGUE RECIBIDO | Proyecto: {project_id}")

        notify_ms01(
            project_id,
            "DEPLOYING",
            f"Iniciando despliegue en K8s (Namespace: {namespace}).",
        )

        try:
            logger.info("⚙️ Llamando al servicio Deployer de K8s...")
            deployer_service.apply_manifests(namespace, manifests)

            logger.info("🎉 Despliegue en K8s completado. Notificando éxito...")
            notify_ms01(
                project_id,
                "DEPLOYED",
                "Despliegue finalizado exitosamente en el clúster.",
            )

        except Exception as deploy_error:
            logger.error(f"❌ Error en K8s: {str(deploy_error)}")
            notify_ms01(
                project_id,
                "FAILED",
                f"Error aplicando manifiestos: {str(deploy_error)}",
            )
            raise deploy_error

        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"✅ Tarea completada y mensaje ACKed.")

    except Exception as e:
        logger.error(f"❌ Error CRÍTICO procesando el mensaje: {str(e)}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consuming():
    logger.info("🐰 Intentando conectar a RabbitMQ...")

    try:
        connection = get_rabbitmq_connection()
        logger.info("✅ Conectado a RabbitMQ")

        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message_received)

        logger.info(f"🎧 [*] Esperando despliegues en la cola '{QUEUE_NAME}'...")
        channel.start_consuming()
    except Exception as e:
        logger.error(f"⚠️ Error conectando a RabbitMQ: {e}")
