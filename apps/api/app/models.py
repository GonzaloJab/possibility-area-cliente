"""SQLAlchemy ORM models — mirrors apps/web/src/types.ts."""
import enum
import uuid
from datetime import datetime
from decimal import Decimal as PyDecimal

from sqlalchemy import (
    DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, UniqueConstraint, func, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class SupplyType(str, enum.Enum):
    RESIDENCIAL = "RESIDENCIAL"
    RESTAURACION = "RESTAURACION"
    EMPRESA = "EMPRESA"


class InvoiceStatus(str, enum.Enum):
    PAGADA = "PAGADA"
    PENDIENTE = "PENDIENTE"
    VENCIDA = "VENCIDA"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supplies: Mapped[list["Supply"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Supply(Base):
    __tablename__ = "supplies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    alias: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    zone: Mapped[str] = mapped_column(String, nullable=False)
    subtitle: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[SupplyType] = mapped_column(
        Enum(SupplyType, name="supply_type"), default=SupplyType.RESIDENCIAL
    )
    hero_image_url: Mapped[str | None] = mapped_column(String, nullable=True)

    contracted_power: Mapped[PyDecimal] = mapped_column(Numeric(6, 2), default=PyDecimal("4.6"))
    cups: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="supplies")
    tariff: Mapped["Tariff | None"] = relationship(back_populates="supply", cascade="all, delete-orphan", uselist=False)
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="supply", cascade="all, delete-orphan")
    consumption: Mapped[list["Consumption"]] = relationship(back_populates="supply", cascade="all, delete-orphan")


class Tariff(Base):
    __tablename__ = "tariffs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    supply_id: Mapped[str] = mapped_column(
        ForeignKey("supplies.id", ondelete="CASCADE"), unique=True
    )

    price_per_kwh: Mapped[PyDecimal] = mapped_column(Numeric(10, 4), nullable=False)
    monthly_base_cost: Mapped[PyDecimal] = mapped_column(Numeric(10, 2), nullable=False)
    market_avg_percent: Mapped[int] = mapped_column(Integer, default=32)
    contract_name: Mapped[str] = mapped_column(String, default="Tarifa Possibility")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supply: Mapped["Supply"] = relationship(back_populates="tariff")


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (Index("ix_invoices_issued_at", "issued_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    supply_id: Mapped[str] = mapped_column(ForeignKey("supplies.id", ondelete="CASCADE"), index=True)

    number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    period: Mapped[str] = mapped_column(String, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[PyDecimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status"), default=InvoiceStatus.PENDIENTE
    )
    pdf_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supply: Mapped["Supply"] = relationship(back_populates="invoices")


class Consumption(Base):
    __tablename__ = "consumption"
    __table_args__ = (UniqueConstraint("supply_id", "year", "month", name="uq_consumption_supply_year_month"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    supply_id: Mapped[str] = mapped_column(ForeignKey("supplies.id", ondelete="CASCADE"), index=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    total_kwh: Mapped[PyDecimal] = mapped_column(Numeric(10, 2), nullable=False)
    change_percent: Mapped[int] = mapped_column(Integer, default=0)
    hourly_profile: Mapped[list[int]] = mapped_column(JSON, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supply: Mapped["Supply"] = relationship(back_populates="consumption")
