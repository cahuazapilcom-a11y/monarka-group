import sendgrid
from sendgrid.helpers.mail import Mail, To, Content
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from config import settings
from models import LeadTemperature

_env = Environment(loader=FileSystemLoader(Path(__file__).parent.parent / "templates"))
_sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)


def _render(template_name: str, **kwargs) -> str:
    return _env.get_template(template_name).render(**kwargs)


def _send(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    message = Mail(
        from_email=(settings.sendgrid_from_email, settings.sendgrid_from_name),
        to_emails=To(to_email, to_name),
        subject=subject,
        html_content=Content("text/html", html_content),
    )
    try:
        response = _sg.send(message)
        return response.status_code in (200, 202)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


async def send_welcome_email(
    name: str,
    email: str,
    temperature: LeadTemperature,
    recommended_products: list[dict],
) -> bool:
    html = _render(
        "welcome_email.html",
        name=name,
        temperature=temperature,
        products=recommended_products,
        business_name=settings.business_name,
        business_phone=settings.business_phone,
    )
    subject = f"¡Bienvenido a {settings.business_name}! Tenemos lo que buscas"
    return _send(email, name, subject, html)


async def send_followup_email(name: str, email: str, day: int) -> bool:
    template = "followup_day3.html" if day == 3 else "followup_day7.html"
    html = _render(
        template,
        name=name,
        business_name=settings.business_name,
        business_phone=settings.business_phone,
    )
    subjects = {
        3: "¿Encontró lo que buscaba? Estamos aquí para ayudarle",
        7: "Oferta especial para usted - Qiru Center",
    }
    return _send(email, name, subjects.get(day, "Recordatorio de Qiru Center"), html)


async def send_payment_confirmed_email(
    client_name: str,
    client_email: str,
    product_name: str,
    amount: float,
    payment_method: str,
    order_id: str,
) -> bool:
    html = _render(
        "payment_confirmed.html",
        name=client_name,
        product_name=product_name,
        amount=amount,
        payment_method=payment_method,
        order_id=order_id,
        business_name=settings.business_name,
        business_phone=settings.business_phone,
    )
    subject = f"✅ Pago confirmado - Pedido {order_id} | {settings.business_name}"
    return _send(client_email, client_name, subject, html)


async def send_hot_lead_alert(name: str, email: str, phone: str, message: str, score: int) -> bool:
    html = _render(
        "hot_lead_alert.html",
        name=name,
        email=email,
        phone=phone,
        message=message,
        score=score,
        business_name=settings.business_name,
    )
    subject = f"🔥 LEAD CALIENTE - {name} (Score {score}/10)"
    return _send(settings.owner_email, "Admin Qiru Center", subject, html)
