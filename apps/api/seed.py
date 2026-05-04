"""Idempotent seed script.

Creates:
  - 1 admin user:   admin@possibility.com / possibility-admin
  - 1 demo client:  felipe@possibility.com / possibility123  (with 3 supplies)

Run: python seed.py
"""
import os
from datetime import datetime
from decimal import Decimal

from dotenv import load_dotenv
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

load_dotenv()

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import (
    Consumption, Invoice, InvoiceStatus, Supply, SupplyType, Tariff, User, UserRole,
)
from app.security import hash_password


SUPPLIES = [
    {
        "alias": "Suministro 1",
        "address": "C/ Ortega y Gasset 24, 4ºB",
        "zone": "Madrid · Salamanca",
        "subtitle": "Tu hogar conectado · Vivienda residencial",
        "type": SupplyType.RESIDENCIAL,
        "hero_image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&auto=format&fit=crop",
        "contracted_power": Decimal("4.60"),
        "supplier": "Iberdrola",
        "tariff": {"price_per_kwh": Decimal("0.0890"), "monthly_base_cost": Decimal("78"), "market_avg_percent": 32},
        "monthly_totals": [320, 290, 310, 280, 260, 240, 220, 210, 195, 180, 170, 160],
        "hourly_profile": [3, 2, 1, 1, 1, 1, 2, 4, 3, 2, 1, 1, 1, 1, 2, 3, 4, 6, 8, 9, 10, 9, 7, 5],
        "invoices": [
            {"number": "F-2026-001", "period": "Mar 2026", "amount": Decimal("87.50"), "issued_at": "2026-03-01"},
            {"number": "F-2026-002", "period": "Feb 2026", "amount": Decimal("91.88"), "issued_at": "2026-02-01"},
            {"number": "F-2026-003", "period": "Ene 2026", "amount": Decimal("105.00"), "issued_at": "2026-01-01"},
            {"number": "F-2025-012", "period": "Dic 2025", "amount": Decimal("118.13"), "issued_at": "2025-12-01"},
            {"number": "F-2025-011", "period": "Nov 2025", "amount": Decimal("96.25"), "issued_at": "2025-11-01"},
        ],
    },
    {
        "alias": "Suministro 2",
        "address": "Av. Diagonal 421, Local 2",
        "zone": "Barcelona · Eixample",
        "subtitle": "Tu negocio en marcha · Restauración",
        "type": SupplyType.RESTAURACION,
        "hero_image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=85&auto=format&fit=crop",
        "contracted_power": Decimal("9.20"),
        "supplier": "Endesa",
        "tariff": {"price_per_kwh": Decimal("0.0940"), "monthly_base_cost": Decimal("142"), "market_avg_percent": 28},
        "monthly_totals": [580, 610, 595, 620, 600, 590, 570, 560, 545, 530, 520, 510],
        "hourly_profile": [5, 5, 4, 4, 4, 4, 5, 6, 7, 8, 9, 10, 10, 9, 7, 6, 7, 8, 9, 10, 10, 9, 7, 6],
        "invoices": [
            {"number": "F-2026-101", "period": "Mar 2026", "amount": Decimal("134.20"), "issued_at": "2026-03-01"},
            {"number": "F-2026-102", "period": "Feb 2026", "amount": Decimal("140.91"), "issued_at": "2026-02-01"},
            {"number": "F-2026-103", "period": "Ene 2026", "amount": Decimal("161.04"), "issued_at": "2026-01-01"},
            {"number": "F-2025-112", "period": "Dic 2025", "amount": Decimal("181.17"), "issued_at": "2025-12-01"},
            {"number": "F-2025-111", "period": "Nov 2025", "amount": Decimal("147.62"), "issued_at": "2025-11-01"},
        ],
    },
    {
        "alias": "Suministro 3",
        "address": "Plaza del Ayuntamiento 15, 1ºB",
        "zone": "Valencia · Centro",
        "subtitle": "Tu espacio de trabajo · Empresa",
        "type": SupplyType.EMPRESA,
        "hero_image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85&auto=format&fit=crop",
        "contracted_power": Decimal("6.90"),
        "supplier": "Naturgy",
        "tariff": {"price_per_kwh": Decimal("0.0840"), "monthly_base_cost": Decimal("65"), "market_avg_percent": 35},
        "monthly_totals": [210, 200, 195, 190, 185, 178, 172, 168, 162, 155, 150, 145],
        "hourly_profile": [1, 1, 1, 1, 1, 1, 2, 4, 8, 9, 10, 10, 9, 10, 10, 10, 9, 8, 5, 2, 1, 1, 1, 1],
        "invoices": [
            {"number": "F-2026-201", "period": "Mar 2026", "amount": Decimal("62.10"), "issued_at": "2026-03-01"},
            {"number": "F-2026-202", "period": "Feb 2026", "amount": Decimal("65.21"), "issued_at": "2026-02-01"},
            {"number": "F-2026-203", "period": "Ene 2026", "amount": Decimal("74.52"), "issued_at": "2026-01-01"},
            {"number": "F-2025-212", "period": "Dic 2025", "amount": Decimal("83.84"), "issued_at": "2025-12-01"},
            {"number": "F-2025-211", "period": "Nov 2025", "amount": Decimal("68.31"), "issued_at": "2025-11-01"},
        ],
    },
]


def main() -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("DATABASE_URL not set")

    engine = create_engine(db_url, future=True)
    with Session(engine) as db:
        # ─── Admin user ────────────────────────────────────────────
        admin = db.execute(select(User).where(User.email == "admin@possibility.com")).scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@possibility.com",
                password_hash=hash_password("possibility-admin"),
                name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                must_change_password=False,
            )
            db.add(admin)
            print("[OK] Admin seeded: admin@possibility.com / possibility-admin")
        else:
            print(f"[OK] Admin already exists: {admin.email}")

        # ─── Demo client ───────────────────────────────────────────
        existing = db.execute(select(User).where(User.email == "felipe@possibility.com")).scalar_one_or_none()
        if existing:
            print(f"[OK] Client already seeded: {existing.email}")
            db.commit()
            return

        user = User(
            email="felipe@possibility.com",
            password_hash=hash_password("possibility123"),
            name="Felipe",
            role=UserRole.CLIENT,
        )
        db.add(user)
        db.flush()

        for s in SUPPLIES:
            supply = Supply(
                user_id=user.id,
                alias=s["alias"], address=s["address"], zone=s["zone"],
                subtitle=s["subtitle"], type=s["type"],
                hero_image_url=s["hero_image_url"],
                contracted_power=s["contracted_power"], supplier=s["supplier"],
            )
            db.add(supply)
            db.flush()
            db.add(Tariff(supply_id=supply.id, **s["tariff"]))

            for inv in s["invoices"]:
                db.add(
                    Invoice(
                        supply_id=supply.id,
                        number=inv["number"], period=inv["period"],
                        amount=inv["amount"],
                        issued_at=datetime.fromisoformat(inv["issued_at"]),
                        status=InvoiceStatus.PAGADA, supplier=s["supplier"],
                    )
                )

            now = datetime.utcnow()
            for i in range(12):
                month = ((now.month - (11 - i) - 1) % 12) + 1
                year = now.year + ((now.month - (11 - i) - 1) // 12)
                total = s["monthly_totals"][i]
                prev = s["monthly_totals"][i - 1] if i > 0 else total
                change = round(((total - prev) / prev) * 100) if prev else 0
                db.add(
                    Consumption(
                        supply_id=supply.id, year=year, month=month,
                        total_kwh=Decimal(total), change_percent=change,
                        hourly_profile=s["hourly_profile"],
                    )
                )

            print(f"[OK] Supply seeded: {supply.alias}")

        db.commit()
        print("[OK] Seed complete.")


if __name__ == "__main__":
    main()
