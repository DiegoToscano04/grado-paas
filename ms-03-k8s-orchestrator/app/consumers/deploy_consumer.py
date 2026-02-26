import json
import pika
from app.core.rabbitmq_config import get_rabbitmq_connection

QUEUE_NAME = "deploy.queue"


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

        # TODO: Aquí llamaremos a la API de Kubernetes para inyectar los manifiestos

        # 2. Confirmar a RabbitMQ que procesamos el mensaje exitosamente (ACK)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"✅ [RABBITMQ] Mensaje procesado y eliminado de la cola.\n")

    except Exception as e:
        print(f"❌[RABBITMQ] Error procesando el mensaje: {str(e)}")
        # Si hay un error crítico, no confirmamos el mensaje para que no se pierda (NACK)
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
