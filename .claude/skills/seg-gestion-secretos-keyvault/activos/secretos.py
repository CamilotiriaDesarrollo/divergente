"""secretos.py — acceso unificado a secretos para datos/scraping (Python).

Local:      variables de entorno / .env (python-dotenv).
Producción: Azure Key Vault vía Managed Identity (DefaultAzureCredential).

Instalar:
    pip install python-dotenv azure-identity azure-keyvault-secrets
"""
import os
from functools import lru_cache

# .env solo en local; en producción las variables ya vienen del entorno o de Key Vault.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

_KV_URI = os.environ.get("KEY_VAULT_URI")
_ENV = os.environ.get("APP_ENV", "development").lower()


@lru_cache(maxsize=None)
def _kv_client():
    from azure.identity import DefaultAzureCredential
    from azure.keyvault.secrets import SecretClient
    return SecretClient(vault_url=_KV_URI, credential=DefaultAzureCredential())


def get_secret(nombre: str, *, requerido: bool = True) -> str | None:
    """Devuelve un secreto por nombre. Variable de entorno primero; Key Vault en prod."""
    val = os.environ.get(nombre)              # 1) entorno / .env (y overrides locales)
    if val:
        return val
    if _KV_URI and _ENV != "development":     # 2) Key Vault (nombres KV usan '-', no '_')
        val = _kv_client().get_secret(nombre.replace("_", "-")).value
        if val:
            return val
    if requerido:
        raise RuntimeError(f"Secreto '{nombre}' no está en el entorno ni en Key Vault.")
    return None


if __name__ == "__main__":
    # Nunca imprimas el valor: solo confirma que resuelve.
    print("DB-PASSWORD resuelto:", get_secret("DB_PASSWORD", requerido=False) is not None)
