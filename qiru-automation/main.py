import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pathlib import Path

from config import settings, PRODUCTS
from models import ZapierWebhook, PaymentConfirmation, LeadTemperature, Lead, LeadSource
from services.ai_classifier import classify_lead
from services.hubspot_service import create_or_update_contact
from services.email_service import (
    send_welcome_email,
    send_payment_confirmed_email,
    send_hot_lead_alert,
)
from services.scheduler import get_scheduler, schedule_followups


Path("data").mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = get_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Qiru Center - Sistema de Automatización",
    version="1.0.0",
    lifespan=lifespan,
)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "business": settings.business_name}


# ── TikTok Lead Gen via Zapier ────────────────────────────────────────────────

@app.post("/webhook/tiktok-lead")
async def tiktok_lead_webhook(payload: ZapierWebhook):
    # Optional secret validation
    if settings.zapier_secret and payload.secret != settings.zapier_secret:
        raise HTTPException(status_code=403, detail="Unauthorized")

    lead = Lead(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message or payload.ad_name or "",
        interest=payload.form_name or "",
        source=LeadSource.tiktok,
    )

    # Classify lead with AI
    classification = await classify_lead(lead.name, lead.message, lead.interest)
    temperature = LeadTemperature(classification["temperature"])
    score = classification["score"]
    recommended_names = classification.get("recommended_products", [])

    # Match recommended products from catalog
    recommended_products = [p for p in PRODUCTS if p["name"] in recommended_names]
    if not recommended_products:
        recommended_products = PRODUCTS[:3]

    # Save to HubSpot CRM
    contact_id = await create_or_update_contact(lead, temperature, score, recommended_names)

    # Send welcome email if email is available
    if lead.email:
        await send_welcome_email(lead.name, lead.email, temperature, recommended_products)
        # Schedule follow-up emails
        schedule_followups(lead.name, lead.email)

    # Alert owner if lead is hot
    if temperature == LeadTemperature.hot:
        await send_hot_lead_alert(lead.name, lead.email or "", lead.phone or "", lead.message, score)

    return {
        "status": "processed",
        "lead": lead.name,
        "temperature": temperature,
        "score": score,
        "hubspot_contact_id": contact_id,
        "email_sent": bool(lead.email),
    }


# ── Manual lead entry ─────────────────────────────────────────────────────────

@app.post("/leads/manual")
async def add_manual_lead(payload: ZapierWebhook):
    payload.secret = settings.zapier_secret or payload.secret
    return await tiktok_lead_webhook(payload)


# ── Payment confirmation ──────────────────────────────────────────────────────

@app.post("/payment/confirm")
async def confirm_payment(data: PaymentConfirmation):
    order_id = data.order_id or f"QC-{uuid.uuid4().hex[:8].upper()}"

    success = await send_payment_confirmed_email(
        client_name=data.client_name,
        client_email=data.client_email,
        product_name=data.product_name,
        amount=data.amount,
        payment_method=data.payment_method,
        order_id=order_id,
    )

    if not success:
        raise HTTPException(status_code=500, detail="No se pudo enviar el correo de confirmación")

    return {
        "status": "payment_confirmed",
        "order_id": order_id,
        "email_sent_to": data.client_email,
    }


# ── Admin Panel ───────────────────────────────────────────────────────────────

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "products": PRODUCTS,
        "business_name": settings.business_name,
    })


# ── Products API ──────────────────────────────────────────────────────────────

@app.get("/products")
async def list_products():
    return {"products": PRODUCTS}
