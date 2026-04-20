import httpx
from config import settings
from models import Lead, LeadTemperature


HUBSPOT_BASE = "https://api.hubapi.com"
HEADERS = {
    "Authorization": f"Bearer {settings.hubspot_api_key}",
    "Content-Type": "application/json",
}


async def create_or_update_contact(
    lead: Lead,
    temperature: LeadTemperature,
    score: int,
    recommended_products: list[str],
) -> str | None:
    if not settings.hubspot_api_key or settings.hubspot_api_key.startswith("CiR"):
        return None

    properties = {
        "firstname": lead.name.split()[0] if lead.name else lead.name,
        "lastname": " ".join(lead.name.split()[1:]) if len(lead.name.split()) > 1 else "",
        "lead_status": _map_temperature(temperature),
        "hs_lead_status": _map_temperature(temperature),
        "leadsource": "TIKTOK" if lead.source == "tiktok" else "OTHER",
        "phone": lead.phone or "",
        "message": lead.message or "",
        "numemployees": str(score),
    }
    if lead.email:
        properties["email"] = lead.email

    async with httpx.AsyncClient() as client:
        # Search for existing contact by email
        if lead.email:
            existing_id = await _find_contact_by_email(client, lead.email)
            if existing_id:
                await _update_contact(client, existing_id, properties)
                await _add_note(client, existing_id, lead, temperature, score, recommended_products)
                return existing_id

        # Create new contact
        resp = await client.post(
            f"{HUBSPOT_BASE}/crm/v3/objects/contacts",
            headers=HEADERS,
            json={"properties": properties},
        )
        if resp.status_code in (200, 201):
            contact_id = resp.json()["id"]
            await _add_note(client, contact_id, lead, temperature, score, recommended_products)
            return contact_id

    return None


async def _find_contact_by_email(client: httpx.AsyncClient, email: str) -> str | None:
    resp = await client.post(
        f"{HUBSPOT_BASE}/crm/v3/objects/contacts/search",
        headers=HEADERS,
        json={
            "filterGroups": [{"filters": [{"propertyName": "email", "operator": "EQ", "value": email}]}],
            "properties": ["email"],
            "limit": 1,
        },
    )
    results = resp.json().get("results", [])
    return results[0]["id"] if results else None


async def _update_contact(client: httpx.AsyncClient, contact_id: str, properties: dict):
    await client.patch(
        f"{HUBSPOT_BASE}/crm/v3/objects/contacts/{contact_id}",
        headers=HEADERS,
        json={"properties": properties},
    )


async def _add_note(
    client: httpx.AsyncClient,
    contact_id: str,
    lead: Lead,
    temperature: LeadTemperature,
    score: int,
    recommended_products: list[str],
):
    products_str = ", ".join(recommended_products) if recommended_products else "N/A"
    note_body = (
        f"Lead clasificado automáticamente\n"
        f"Temperatura: {temperature.upper()} (Score: {score}/10)\n"
        f"Fuente: {lead.source}\n"
        f"Productos recomendados: {products_str}\n"
        f"Mensaje original: {lead.message or 'Sin mensaje'}"
    )

    note_resp = await client.post(
        f"{HUBSPOT_BASE}/crm/v3/objects/notes",
        headers=HEADERS,
        json={
            "properties": {
                "hs_note_body": note_body,
                "hs_timestamp": str(int(lead.created_at.timestamp() * 1000)),
            }
        },
    )
    if note_resp.status_code in (200, 201):
        note_id = note_resp.json()["id"]
        await client.put(
            f"{HUBSPOT_BASE}/crm/v3/objects/notes/{note_id}/associations/contacts/{contact_id}/note_to_contact",
            headers=HEADERS,
        )


def _map_temperature(temperature: LeadTemperature) -> str:
    mapping = {
        LeadTemperature.hot: "IN_PROGRESS",
        LeadTemperature.warm: "OPEN",
        LeadTemperature.cold: "NEW",
    }
    return mapping.get(temperature, "NEW")
