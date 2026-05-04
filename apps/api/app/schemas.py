"""Pydantic v2 request/response schemas."""
from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import InvoiceStatus, SupplyType


# ─── Auth ────────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterIn(LoginIn):
    name: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    name: str


class TokenOut(BaseModel):
    token: str
    user: UserOut


# ─── Tariff ──────────────────────────────────────────────────────────
class TariffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    supply_id: str = Field(serialization_alias="supplyId", validation_alias="supply_id")
    price_per_kwh: Decimal = Field(serialization_alias="pricePerKwh", validation_alias="price_per_kwh")
    monthly_base_cost: Decimal = Field(serialization_alias="monthlyBaseCost", validation_alias="monthly_base_cost")
    market_avg_percent: int = Field(serialization_alias="marketAvgPercent", validation_alias="market_avg_percent")
    contract_name: str = Field(serialization_alias="contractName", validation_alias="contract_name")


# ─── Invoice ─────────────────────────────────────────────────────────
class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    supply_id: str = Field(serialization_alias="supplyId", validation_alias="supply_id")
    number: str
    period: str
    issued_at: datetime = Field(serialization_alias="issuedAt", validation_alias="issued_at")
    amount: Decimal
    status: InvoiceStatus
    pdf_url: str | None = Field(default=None, serialization_alias="pdfUrl", validation_alias="pdf_url")


# ─── Consumption ─────────────────────────────────────────────────────
class ConsumptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    supply_id: str = Field(serialization_alias="supplyId", validation_alias="supply_id")
    year: int
    month: int
    total_kwh: Decimal = Field(serialization_alias="totalKwh", validation_alias="total_kwh")
    change_percent: int = Field(serialization_alias="changePercent", validation_alias="change_percent")
    hourly_profile: list[int] = Field(serialization_alias="hourlyProfile", validation_alias="hourly_profile")


# ─── Supply ──────────────────────────────────────────────────────────
class SupplyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    alias: str
    address: str
    zone: str
    subtitle: str
    type: SupplyType
    hero_image_url: str | None = Field(default=None, serialization_alias="heroImageUrl", validation_alias="hero_image_url")
    contracted_power: Decimal = Field(serialization_alias="contractedPower", validation_alias="contracted_power")
    cups: str | None = None
    tariff: TariffOut | None = None


class SupplyDetailOut(SupplyOut):
    invoices: list[InvoiceOut] = []
    consumption: list[ConsumptionOut] = []


# ─── Wrappers (the frontend expects { key: ... }) ────────────────────
class SuppliesResponse(BaseModel):
    supplies: list[SupplyOut]


class SupplyResponse(BaseModel):
    supply: SupplyDetailOut


class InvoicesResponse(BaseModel):
    invoices: list[InvoiceOut]


class ConsumptionResponse(BaseModel):
    consumption: list[ConsumptionOut]


class TariffResponse(BaseModel):
    tariff: TariffOut


class UserResponse(BaseModel):
    user: UserOut


# ═══════════════════════════════════════════════════════════════════
# ADMIN — pipe.possibility.es
# ═══════════════════════════════════════════════════════════════════

from app.models import UserRole  # noqa: E402


# ─── Client management ─────────────────────────────────────────────
class ClientCreateIn(BaseModel):
    """Admin creates a new client account."""
    email: EmailStr
    name: str = Field(min_length=1)


class ClientCreateOut(BaseModel):
    """Returned to admin after creating a client. Contains the temp password
    so the admin can copy/paste it to the client (WhatsApp, in-person, etc.)."""
    user: UserOut
    temp_password: str = Field(serialization_alias="tempPassword")


class ClientUpdateIn(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = Field(default=None, alias="isActive")


class ClientSummary(BaseModel):
    """Compact view for the clients list page."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool = Field(serialization_alias="isActive", validation_alias="is_active")
    supplies_count: int = Field(default=0, serialization_alias="suppliesCount")
    last_invoice_at: datetime | None = Field(default=None, serialization_alias="lastInvoiceAt")
    created_at: datetime = Field(serialization_alias="createdAt", validation_alias="created_at")


class ClientsResponse(BaseModel):
    clients: list[ClientSummary]


class ClientDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool = Field(serialization_alias="isActive", validation_alias="is_active")
    must_change_password: bool = Field(serialization_alias="mustChangePassword", validation_alias="must_change_password")
    created_at: datetime = Field(serialization_alias="createdAt", validation_alias="created_at")
    supplies: list[SupplyDetailOut] = []


class ClientDetailResponse(BaseModel):
    client: ClientDetail


# ─── Supply management (admin) ──────────────────────────────────────
class SupplyCreateIn(BaseModel):
    alias: str
    address: str
    zone: str
    subtitle: str = ""
    type: SupplyType = SupplyType.RESIDENCIAL
    hero_image_url: str | None = Field(default=None, alias="heroImageUrl")
    contracted_power: Decimal = Field(default=Decimal("4.6"), alias="contractedPower")
    cups: str | None = None
    supplier: str | None = None


class SupplyUpdateIn(BaseModel):
    alias: str | None = None
    address: str | None = None
    zone: str | None = None
    subtitle: str | None = None
    type: SupplyType | None = None
    hero_image_url: str | None = Field(default=None, alias="heroImageUrl")
    contracted_power: Decimal | None = Field(default=None, alias="contractedPower")
    cups: str | None = None
    supplier: str | None = None


# ─── OCR + invoice import flow ───────────────────────────────────────
class OcrPreviewOut(BaseModel):
    """Returned per-PDF after OCR runs (preview, NOT yet saved)."""
    filename: str
    is_stub: bool = Field(serialization_alias="isStub")  # True while OCR is in placeholder mode
    extracted: dict[str, Any]                            # OcrResult.to_dict()
    raw_ocr: dict[str, Any] = Field(serialization_alias="rawOcr")


class OcrPreviewResponse(BaseModel):
    previews: list[OcrPreviewOut]


class InvoiceImportItem(BaseModel):
    """Admin-confirmed (and possibly edited) invoice data, ready to save."""
    number: str
    period: str
    issued_at: datetime = Field(alias="issuedAt")
    amount: Decimal
    status: InvoiceStatus = InvoiceStatus.PAGADA
    supplier: str | None = None
    raw_ocr: dict[str, Any] | None = Field(default=None, alias="rawOcr")
    pdf_url: str | None = Field(default=None, alias="pdfUrl")  # set after R2 upload (future)


class InvoiceBulkImportIn(BaseModel):
    invoices: list[InvoiceImportItem]


class InvoiceBulkImportOut(BaseModel):
    created: int
    skipped: list[str] = []  # invoice numbers that already existed


# ─── Impersonation + password reset ──────────────────────────────────
class ImpersonateOut(BaseModel):
    """Admin-issued JWT to view the dashboard as a client."""
    token: str
    user: UserOut
    expires_in_minutes: int = Field(serialization_alias="expiresInMinutes")


class ResetPasswordOut(BaseModel):
    temp_password: str = Field(serialization_alias="tempPassword")
