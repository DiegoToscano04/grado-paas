import json
import pika
import requests
from app.core.rabbitmq_config import get_rabbitmq_connection
from app.services.k8s_deployer import KubernetesDeployerService

QUEUE_NAME = "deploy.queue"
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
            print(f"🔄 MS-01 notificado exitosamente -> Estado: {status}")
        else:
            print(
                f"⚠️ Error notificando a MS-01 (Status {response.status_code}): {response.text}"
            )
    except Exception as e:
        print(f"⚠️ Fallo de conexión al notificar a MS-01: {e}")


def on_message_received(ch, method, properties, body):
    """
    Esta función se ejecuta CADA VEZ que llega un mensaje nuevo a la cola.
    """
    try:
        # 1. Leer el mensaje (que vendrá de Java en formato JSON)
        message = json.loads(body)
        project_id = message.get("projectId")
        namespace = message.get("namespaceName")
        manifests = message.get("manifests", [])

        print(f"\n📥 [RABBITMQ] Nuevo despliegue recibido!")
        print(f"📦 Proyecto ID: {project_id}")
        print(f"🏗️ Namespace: {namespace}")
        print(f"📄 Cantidad de Manifiestos a aplicar: {len(manifests)}")

        # 1. Avisar a Java que empezamos (DEPLOYING)
        notify_ms01(
            project_id,
            "DEPLOYING",
            f"Iniciando despliegue en Kubernetes (Namespace: {namespace}).",
        )

        try:
            # 2. Aplicar en Kubernetes
            deployer_service.apply_manifests(namespace, manifests)

            # 3. Avisar a Java que terminamos con éxito (DEPLOYED)
            notify_ms01(
                project_id,
                "DEPLOYED",
                "Despliegue finalizado exitosamente en el clúster.",
            )

        except Exception as deploy_error:
            # 3B. Avisar a Java que algo falló (FAILED)
            error_msg = f"Error aplicando manifiestos: {str(deploy_error)}"
            print(f"❌ Error en K8s: {error_msg}")
            notify_ms01(project_id, "FAILED", error_msg)
            raise deploy_error

        # Confirmar a RabbitMQ
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"✅ [RABBITMQ] Tarea completada y mensaje ACKed.\n")

    except Exception as e:
        print(f"❌[RABBITMQ] Error CRÍTICO procesando el mensaje: {str(e)}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consuming():
    """
    Conecta a RabbitMQ y se queda escuchando infinitamente.
    """
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()

        # Asegurarnos de que la cola exista (durable=True significa que sobrevive a reinicios)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        # Le decimos que consuma de la cola y use nuestra función 'on_message_received'
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message_received)

        print(f"🎧 [*] Esperando mensajes en la cola '{QUEUE_NAME}'...")
        channel.start_consuming()
    except Exception as e:
        print(f"⚠️ Error conectando a RabbitMQ: {e}")
