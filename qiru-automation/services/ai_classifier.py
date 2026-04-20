import anthropic
import json
from config import settings, PRODUCTS
from models import LeadTemperature


client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

PRODUCT_LIST = "\n".join(
    f"- {p['name']} ({p['category']}) - S/. {p['price']:.2f}" for p in PRODUCTS
)

SYSTEM_PROMPT = f"""Eres un asistente de ventas experto de Qiru Center, una tienda de muebles y colchones en Perú.

Catálogo de productos:
{PRODUCT_LIST}

Tu tarea es analizar el mensaje de un lead (cliente potencial) y clasificarlo según su temperatura de compra:

- CALIENTE: Quiere comprar pronto, pregunta por precios, disponibilidad, formas de pago o tiene urgencia.
- TIBIO: Muestra interés pero no urgencia, pide información general, compara opciones.
- FRIO: Apenas explorando, sin intención clara, solo curiosidad o solicitud muy vaga.

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{{
  "temperature": "caliente" | "tibio" | "frio",
  "score": <número del 1 al 10>,
  "reasoning": "<una oración explicando por qué>",
  "recommended_products": ["<nombre producto 1>", "<nombre producto 2>"]
}}"""


async def classify_lead(name: str, message: str, interest: str = "") -> dict:
    user_content = f"Nombre: {name}\nMensaje: {message}\nInterés declarado: {interest}"

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    text = response.content[0].text.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    result = json.loads(text)
    return result
