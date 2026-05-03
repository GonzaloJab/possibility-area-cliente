"""Supply endpoints — all scoped to the authenticated user."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.deps import get_current_user
from app.models import Consumption, Invoice, Supply, User
from app.schemas import (
    ConsumptionResponse, InvoicesResponse, SuppliesResponse, SupplyResponse, TariffResponse,
)

router = APIRouter(prefix="/supplies", tags=["supplies"])


async def _own_supply(db: AsyncSession, user: User, supply_id: str) -> Supply:
    result = await db.execute(
        select(Supply)
        .where(Supply.id == supply_id, Supply.user_id == user.id)
        .options(selectinload(Supply.tariff))
    )
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


@router.get("", response_model=SuppliesResponse)
async def list_supplies(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Supply)
        .where(Supply.user_id == user.id)
        .order_by(Supply.created_at.asc())
        .options(selectinload(Supply.tariff))
    )
    return SuppliesResponse(supplies=list(result.scalars().all()))


@router.get("/{supply_id}", response_model=SupplyResponse)
async def get_supply(
    supply_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Supply)
        .where(Supply.id == supply_id, Supply.user_id == user.id)
        .options(
            selectinload(Supply.tariff),
            selectinload(Supply.invoices),
            selectinload(Supply.consumption),
        )
    )
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    # Sort invoices desc, consumption asc
    supply.invoices.sort(key=lambda i: i.issued_at, reverse=True)
    supply.consumption.sort(key=lambda c: (c.year, c.month))
    return SupplyResponse(supply=supply)  # pydantic from_attributes handles it


@router.get("/{supply_id}/invoices", response_model=InvoicesResponse)
async def get_invoices(
    supply_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _own_supply(db, user, supply_id)
    result = await db.execute(
        select(Invoice).where(Invoice.supply_id == supply_id).order_by(Invoice.issued_at.desc())
    )
    return InvoicesResponse(invoices=list(result.scalars().all()))


@router.get("/{supply_id}/consumption", response_model=ConsumptionResponse)
async def get_consumption(
    supply_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _own_supply(db, user, supply_id)
    result = await db.execute(
        select(Consumption)
        .where(Consumption.supply_id == supply_id)
        .order_by(Consumption.year.asc(), Consumption.month.asc())
    )
    return ConsumptionResponse(consumption=list(result.scalars().all()))


@router.get("/{supply_id}/tariff", response_model=TariffResponse)
async def get_tariff(
    supply_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    supply = await _own_supply(db, user, supply_id)
    if not supply.tariff:
        raise HTTPException(status_code=404, detail="Tariff not configured")
    return TariffResponse(tariff=supply.tariff)
