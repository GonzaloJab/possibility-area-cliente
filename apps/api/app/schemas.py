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
