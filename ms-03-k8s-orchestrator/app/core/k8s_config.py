from kubernetes import client, config
import os


def init_k8s_client():
    """
    Inicializa el cliente de Kubernetes.
    Como estamos ejecutando Python directamente en Ubuntu (donde está MicroK8s),
    intentará cargar la configuración local por defecto (~/.kube/config).
    """
    try:
        # Intenta cargar la configuración local (fuera del clúster)
        config.load_kube_config()
        print("✅ Conectado a Kubernetes exitosamente (Kubeconfig local).")
    except Exception as e:
        print(f"⚠️ No se pudo cargar la configuración local de K8s: {e}")
        try:
            # Fallback: Si en el futuro metemos este MS-03 dentro de un Pod, usará esto:
            config.load_incluster_config()
            print("✅ Conectado a Kubernetes exitosamente (In-Cluster).")
        except Exception as inner_e:
            print(f"❌ Error fatal al conectar con Kubernetes: {inner_e}")
            raise inner_e

    # Retornamos los clientes principales que usaremos
    core_v1 = client.CoreV1Api()
    apps_v1 = client.AppsV1Api()
    networking_v1 = client.NetworkingV1Api()

    return core_v1, apps_v1, networking_v1
