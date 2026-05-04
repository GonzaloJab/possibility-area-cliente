"""OCR adapter — placeholder until the real Python module is dropped in.

INTEGRATION POINT FOR GONZALO:
Replace the body of `extract_invoice()` with a call to your OCR module.
The contract is:
    Input  → bytes (raw PDF content)
    Output → OcrResult (dict-like with all extractable fields, supplier-tagged)

Anything your OCR returns that doesn't fit the named fields below should go
into `extra_fields` so it gets stored in `Invoice.raw_ocr` for later use.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any


@dataclass
class OcrResult:
    """Structured OCR output. Every field is optional — the admin reviews
    and fills gaps before saving."""
    # Core invoice fields
    number: str | None = None
    period: str | None = None              # e.g. "Mar 2026"
    issued_at: date | None = None
    amount: Decimal | None = None

    # Supply identification
    cups: str | None = None                # Spanish supply identifier
    address: str | None = None
    supplier: str | None = None            # "Iberdrola", "Endesa", "Naturgy", etc.

    # Tariff details
    price_per_kwh: Decimal | None = None
    contracted_power: Decimal | None = None
    contract_name: str | None = None

    # Consumption (if invoice includes it)
    total_kwh: Decimal | None = None

    # Anything supplier-specific that doesn't fit above
    extra_fields: dict[str, Any] = field(default_factory=dict)

    # OCR confidence (0-1) — useful if your OCR exposes it
    confidence: float | None = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        # JSON-serialize dates and decimals
        if self.issued_at:
            d["issued_at"] = self.issued_at.isoformat()
        for k in ("amount", "price_per_kwh", "contracted_power", "total_kwh"):
            if d.get(k) is not None:
                d[k] = str(d[k])
        return d


def extract_invoice(pdf_bytes: bytes) -> OcrResult:
    """Run OCR on a single invoice PDF.

    PLACEHOLDER: returns mock data so the admin app is fully clickable end-to-end
    while you finalize the real OCR script. Drop the real implementation here.

    Args:
        pdf_bytes: raw PDF content.

    Returns:
        OcrResult — admin reviews each field in the UI before saving.
    """
    # When the real OCR is ready, do something like:
    #
    #     from possibility_ocr import run_ocr   # your module
    #     raw = run_ocr(pdf_bytes)
    #     return OcrResult(
    #         number=raw["invoice_number"],
    #         period=raw["billing_period"],
    #         issued_at=date.fromisoformat(raw["date"]),
    #         amount=Decimal(raw["total"]),
    #         cups=raw.get("cups"),
    #         address=raw.get("supply_address"),
    #         supplier=raw["supplier"],
    #         price_per_kwh=Decimal(raw["price_per_kwh"]),
    #         contracted_power=Decimal(raw.get("power_kw", 0)),
    #         contract_name=raw.get("tariff_name"),
    #         total_kwh=Decimal(raw.get("kwh_consumed", 0)),
    #         extra_fields=raw.get("extra", {}),
    #         confidence=raw.get("confidence"),
    #     )

    # Mock for now — admin UI shows a banner saying "OCR is in stub mode"
    if not pdf_bytes:
        return OcrResult()

    return OcrResult(
        number="F-PENDIENTE",
        period="—",
        issued_at=date.today(),
        amount=Decimal("0.00"),
        cups=None,
        address=None,
        supplier="Desconocido",
        price_per_kwh=None,
        contracted_power=None,
        contract_name=None,
        total_kwh=None,
        extra_fields={"_stub": True, "_pdf_bytes_len": len(pdf_bytes)},
        confidence=0.0,
    )


def is_stub() -> bool:
    """Returns True while the placeholder is in use; flip to False (or remove)
    when the real OCR is wired in. The admin UI uses this to show a warning banner."""
    return True
