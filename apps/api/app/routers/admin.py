"""Admin endpoints — pipe.possibility.es uses these.

All routes require role==ADMIN. Mounted at /admin.
"""
from datetime import datetime
from decimal import Decimal as PyDecimal
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.deps import get_current_admin
from app.models import Invoice, InvoiceStatus, Supply, User, UserRole
from app.ocr import extract_invoice
from app.ocr.extractor import is_stub
from app.schemas import (
    ClientCreateIn, ClientCreateOut, ClientDetail, ClientDetailResponse,
    ClientSummary, ClientUpdateIn, ClientsResponse, ImpersonateOut,
    InvoiceBulkImportIn, InvoiceBulkImportOut, OcrPreviewOut, OcrPreviewResponse,
    ResetPasswordOut, SupplyCreateIn, SupplyDetailOut, SupplyUpdateIn, UserOut,
)
from app.security import (
    create_access_token, generate_temp_password, hash_password,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


# ─── Clients: list / create / detail / update / delete (soft) ──────
@router.get("/clients", response_model=ClientsResponse)
async def list_clients(db: AsyncSession = Depends(get_db)):
    # Subquery: count of supplies + most recent invoice per user
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.CLIENT)
        .order_by(User.created_at.desc())
        .options(selectinload(User.supplies).selectinload(Supply.invoices))
    )
    users = result.scalars().all()
    summaries: list[ClientSummary] = []
    for u in users:
        supplies = u.supplies
        last_invoice_at = None
        for s in supplies:
            for inv in s.invoices:
                if last_invoice_at is None or inv.issued_at > last_invoice_at:
                    last_invoice_at = inv.issued_at
        summaries.append(
            ClientSummary(
                id=u.id, email=u.email, name=u.name, role=u.role,
                is_active=u.is_active, supplies_count=len(supplies),
                last_invoice_at=last_invoice_at, created_at=u.created_at,
            )
        )
    return ClientsResponse(clients=summaries)


@router.post("/clients", response_model=ClientCreateOut, status_code=status.HTTP_201_CREATED)
async def create_client(body: ClientCreateIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == str(body.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")

    temp_pw = generate_temp_password()
    user = User(
        email=str(body.email),
        password_hash=hash_password(temp_pw),
        name=body.name,
        role=UserRole.CLIENT,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return ClientCreateOut(user=UserOut.model_validate(user), temp_password=temp_pw)


@router.get("/clients/{client_id}", response_model=ClientDetailResponse)
async def get_client(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(User.id == client_id, User.role == UserRole.CLIENT)
        .options(
            selectinload(User.supplies).selectinload(Supply.tariff),
            selectinload(User.supplies).selectinload(Supply.invoices),
            selectinload(User.supplies).selectinload(Supply.consumption),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    detail = ClientDetail(
        id=user.id, email=user.email, name=user.name, role=user.role,
        is_active=user.is_active, must_change_password=user.must_change_password,
        created_at=user.created_at,
        supplies=[SupplyDetailOut.model_validate(s) for s in user.supplies],
    )
    return ClientDetailResponse(client=detail)


@router.patch("/clients/{client_id}", response_model=ClientDetailResponse)
async def update_client(client_id: str, body: ClientUpdateIn, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, client_id)
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")

    if body.name is not None:
        user.name = body.name
    if body.email is not None:
        user.email = str(body.email)
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    return await get_client(client_id, db)


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: str, db: AsyncSession = Depends(get_db)):
    """Soft-delete: deactivate. Use full deletion via DB if you really need it."""
    user = await db.get(User, client_id)
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")
    user.is_active = False
    await db.commit()


# ─── Supplies (admin-only — clients use the read-only /supplies routes) ──
@router.post("/clients/{client_id}/supplies", response_model=SupplyDetailOut, status_code=201)
async def create_supply(
    client_id: str, body: SupplyCreateIn, db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, client_id)
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")

    supply = Supply(
        user_id=user.id,
        alias=body.alias, address=body.address, zone=body.zone,
        subtitle=body.subtitle or f"Suministro · {body.address}",
        type=body.type, hero_image_url=body.hero_image_url,
        contracted_power=body.contracted_power, cups=body.cups, supplier=body.supplier,
    )
    db.add(supply)
    await db.commit()
    await db.refresh(supply)

    # Eager-load empty relationships for the response
    result = await db.execute(
        select(Supply).where(Supply.id == supply.id).options(
            selectinload(Supply.tariff),
            selectinload(Supply.invoices),
            selectinload(Supply.consumption),
        )
    )
    return SupplyDetailOut.model_validate(result.scalar_one())


@router.patch("/supplies/{supply_id}", response_model=SupplyDetailOut)
async def update_supply(supply_id: str, body: SupplyUpdateIn, db: AsyncSession = Depends(get_db)):
    supply = await db.get(Supply, supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    for k, v in body.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(supply, k, v)
    await db.commit()
    await db.refresh(supply)
    return SupplyDetailOut.model_validate(supply)


@router.delete("/supplies/{supply_id}", status_code=204)
async def delete_supply(supply_id: str, db: AsyncSession = Depends(get_db)):
    supply = await db.get(Supply, supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    await db.delete(supply)
    await db.commit()


# ─── OCR preview + bulk invoice import ───────────────────────────────
@router.post("/supplies/{supply_id}/ocr-preview", response_model=OcrPreviewResponse)
async def ocr_preview(
    supply_id: str,
    files: List[UploadFile] = File(..., description="One or more invoice PDFs"),
    db: AsyncSession = Depends(get_db),
):
    """Run OCR on each uploaded PDF and return the extracted fields.
    NOTHING is saved here — the admin reviews + edits in the UI, then calls
    the bulk-import endpoint with the confirmed values.
    """
    supply = await db.get(Supply, supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    previews: list[OcrPreviewOut] = []
    for f in files:
        content = await f.read()
        result = extract_invoice(content)
        d = result.to_dict()
        previews.append(
            OcrPreviewOut(
                filename=f.filename or "invoice.pdf",
                is_stub=is_stub(),
                extracted=d,
                raw_ocr=d,  # for now they're the same; once OCR returns structured
                            # data we may want to store the truly raw response here
            )
        )

    return OcrPreviewResponse(previews=previews)


@router.post("/supplies/{supply_id}/invoices/bulk", response_model=InvoiceBulkImportOut)
async def bulk_import_invoices(
    supply_id: str, body: InvoiceBulkImportIn, db: AsyncSession = Depends(get_db),
):
    """Save invoices the admin has reviewed (and possibly edited) in the UI."""
    supply = await db.get(Supply, supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    # Fetch existing invoice numbers for this supply to skip duplicates
    existing = await db.execute(
        select(Invoice.number).where(Invoice.supply_id == supply_id)
    )
    existing_numbers = {row[0] for row in existing.all()}

    created = 0
    skipped: list[str] = []
    for item in body.invoices:
        if item.number in existing_numbers:
            skipped.append(item.number)
            continue
        db.add(
            Invoice(
                supply_id=supply_id,
                number=item.number,
                period=item.period,
                issued_at=item.issued_at,
                amount=item.amount,
                status=item.status,
                supplier=item.supplier,
                raw_ocr=item.raw_ocr,
                pdf_url=item.pdf_url,
            )
        )
        created += 1

    await db.commit()
    return InvoiceBulkImportOut(created=created, skipped=skipped)


# ─── Impersonation ──────────────────────────────────────────────────
@router.post("/clients/{client_id}/impersonate", response_model=ImpersonateOut)
async def impersonate(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Issue a short-lived (1h) JWT for the client account.
    The token carries `impersonator: <admin_id>` so future audit logging can
    reconstruct who acted as whom."""
    user = await db.get(User, client_id)
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")

    token = create_access_token(
        user_id=user.id, email=user.email, role=user.role.value,
        impersonator_id=admin.id,
    )
    return ImpersonateOut(
        token=token, user=UserOut.model_validate(user), expires_in_minutes=60,
    )


# ─── Password reset ─────────────────────────────────────────────────
@router.post("/clients/{client_id}/reset-password", response_model=ResetPasswordOut)
async def reset_password(client_id: str, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, client_id)
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")

    temp_pw = generate_temp_password()
    user.password_hash = hash_password(temp_pw)
    user.must_change_password = True
    await db.commit()
    return ResetPasswordOut(temp_password=temp_pw)
