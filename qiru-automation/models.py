from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime


class LeadTemperature(str, Enum):
    cold = "frio"
    warm = "tibio"
    hot = "caliente"


class LeadSource(str, Enum):
    tiktok = "tiktok"
    manual = "manual"
    email = "email"


class Lead(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = ""
    interest: Optional[str] = ""
    source: LeadSource = LeadSource.tiktok
    created_at: datetime = None

    def model_post_init(self, __context):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


class LeadResult(BaseModel):
    lead: Lead
    temperature: LeadTemperature
    score: int
    reasoning: str
    hubspot_contact_id: Optional[str] = None


class PaymentConfirmation(BaseModel):
    client_email: str
    client_name: str
    product_name: str
    amount: float
    payment_method: str
    order_id: Optional[str] = None


class ZapierWebhook(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = ""
    ad_name: Optional[str] = ""
    form_name: Optional[str] = ""
    secret: Optional[str] = ""
