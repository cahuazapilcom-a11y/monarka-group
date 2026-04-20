from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Anthropic
    anthropic_api_key: str

    # HubSpot
    hubspot_api_key: str

    # SendGrid
    sendgrid_api_key: str
    sendgrid_from_email: str = "noreply@quirucenter.com"
    sendgrid_from_name: str = "Qiru Center"

    # Owner
    owner_email: str = "cahuazapilcom@gmail.com"
    owner_whatsapp: str = "918156548"

    # Business
    business_name: str = "Qiru Center, Tu Hogar Bonito"
    business_phone: str = "918156548"

    # Security
    zapier_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

PRODUCTS = [
    {"name": "Colchón Queen Size", "category": "Colchones", "material": "Memory Foam", "price": 450.00},
    {"name": "Sofá Cama 3 Plazas", "category": "Muebles", "material": "Tela Velvet", "price": 380.00},
    {"name": "Colchón King Orthopedic", "category": "Colchones", "material": "Resortes Ensacados", "price": 620.00},
    {"name": "Comedor para 4 personas", "category": "Muebles", "material": "Madera de Roble", "price": 550.00},
    {"name": "Base de Cama Matrimonial", "category": "Muebles", "material": "Metal Reforzado", "price": 120.00},
    {"name": "Colchón Individual", "category": "Colchones", "material": "Espuma de Alta Densidad", "price": 180.00},
    {"name": "Sillón Reclinable", "category": "Muebles", "material": "Cuero Sintético", "price": 290.00},
    {"name": "Escritorio de Oficina", "category": "Muebles", "material": "Vidrio y Acero", "price": 150.00},
    {"name": "Cómoda de 6 Cajones", "category": "Muebles", "material": "Melamina", "price": 210.00},
    {"name": "Colchón Híbrido Matrimonial", "category": "Colchones", "material": "Gel + Resortes", "price": 530.00},
]

FOLLOWUP_DAYS = [3, 7]
