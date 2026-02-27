from kubernetes import client, config
import os


def init_k8s_client():
    """
    Inicializa el cliente de Kubernetes.
    Como estamos ejecutando Python directamente en Ubuntu (donde está MicroK8s),
    intentará cargar la configuración local por defecto (~/.kube/config).
    """
    try:
        config.load_kube_config()
        print("✅ Conectado a Kubernetes exitosamente (Kubeconfig local).")
    except Exception as e:
        print(f"⚠️ No se pudo cargar la configuración local de K8s: {e}")
        try:
            config.load_incluster_config()
            print("✅ Conectado a Kubernetes exitosamente (In-Cluster).")
        except Exception as inner_e:
            print(f"❌ Error fatal al conectar con Kubernetes: {inner_e}")
            raise inner_e

    # Retornamos el api_client genérico y el core_v1
    api_client = client.ApiClient()
    core_v1 = client.CoreV1Api()

    return api_client, core_v1
