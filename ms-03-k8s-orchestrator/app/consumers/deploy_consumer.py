import json
import pika
from app.core.rabbitmq_config import get_rabbitmq_connection
from app.services.k8s_deployer import KubernetesDeployerService

QUEUE_NAME = "deploy.queue"
deployer_service = KubernetesDeployerService()


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

        # --- MAGIA: APLICAR EN KUBERNETES ---
        deployer_service.apply_manifests(namespace, manifests)
        # ------------------------------------

        # Confirmar a RabbitMQ
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"✅ [RABBITMQ] Tarea completada y mensaje ACKed.\n")

    except Exception as e:
        print(f"❌[RABBITMQ] Error CRÍTICO procesando el mensaje: {str(e)}")
        # NACK: No confirmamos, el mensaje se queda en la cola o va a una Dead Letter Queue
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
