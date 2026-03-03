import json
import pika
import requests
from app.core.rabbitmq_config import get_rabbitmq_connection
from app.services.k8s_deployer import KubernetesDeployerService

QUEUE_NAME = "terminate.queue"
MS01_URL = "http://localhost:8081/api/internal/projects"
INTERNAL_API_KEY = "super-secret-internal-key-123"

deployer_service = KubernetesDeployerService()


def notify_ms01(project_id: str, status: str, message: str):
    """Llama a MS-01 para actualizar el estado del proyecto."""
    try:
        url = f"{MS01_URL}/{project_id}/status"
        headers = {
            "Content-Type": "application/json",
            "X-Internal-API-Key": INTERNAL_API_KEY,
        }
        payload = {"status": status, "message": message}
        response = requests.patch(url, json=payload, headers=headers)
        if response.status_code == 200:
            print(f"🔄 MS-01 notificado de la eliminación: {status}")
        else:
            print(f"⚠️ Error notificando a MS-01: {response.text}")
    except Exception as e:
        print(f"⚠️ Fallo de conexión al notificar a MS-01: {e}")


def on_message_received(ch, method, properties, body):
    try:
        message = json.loads(body)
        project_id = message.get("projectId")
        namespace = message.get("namespaceName")

        print(f"\n🧨 [RABBITMQ] Orden de DESTRUCCIÓN recibida! Proyecto: {project_id}")

        try:
            # 1. Eliminar físicamente en Kubernetes
            deployer_service.delete_namespace(namespace)

            # 2. Avisar a Java que terminamos con éxito (TERMINATED)
            # Esto hará que Java llene el campo 'deleted_at' y libere la cuota
            notify_ms01(
                project_id,
                "TERMINATED",
                "Namespace y recursos eliminados exitosamente de K8s.",
            )

        except Exception as delete_error:
            # 2B. Avisar a Java que algo falló
            notify_ms01(
                project_id, "FAILED", f"Error eliminando en K8s: {str(delete_error)}"
            )
            raise delete_error

        # Confirmar a RabbitMQ
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"✅ [RABBITMQ] Destrucción completada y mensaje ACKed.\n")

    except Exception as e:
        print(
            f"❌[RABBITMQ] Error CRÍTICO procesando el mensaje de destrucción: {str(e)}"
        )
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_terminate_consuming():
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message_received)

        print(f"🎧 [*] Esperando órdenes de destrucción en '{QUEUE_NAME}'...")
        channel.start_consuming()
    except Exception as e:
        print(f"⚠️ Error conectando a RabbitMQ (Terminate): {e}")
