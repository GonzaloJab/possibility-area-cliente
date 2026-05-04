"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-03

"""
from typing import Union
from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    supply_type = sa.Enum("RESIDENCIAL", "RESTAURACION", "EMPRESA", name="supply_type")
    invoice_status = sa.Enum("PAGADA", "PENDIENTE", "VENCIDA", name="invoice_status")
    supply_type.create(op.get_bind(), checkfirst=True)
    invoice_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "supplies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("alias", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("zone", sa.String(), nullable=False),
        sa.Column("subtitle", sa.String(), nullable=False),
        sa.Column("type", supply_type, nullable=False, server_default="RESIDENCIAL"),
        sa.Column("hero_image_url", sa.String(), nullable=True),
        sa.Column("contracted_power", sa.Numeric(6, 2), nullable=False, server_default="4.6"),
        sa.Column("cups", sa.String(), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_supplies_user_id", "supplies", ["user_id"])

    op.create_table(
        "tariffs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("supply_id", sa.String(), sa.ForeignKey("supplies.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("price_per_kwh", sa.Numeric(10, 4), nullable=False),
        sa.Column("monthly_base_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("market_avg_percent", sa.Integer(), nullable=False, server_default="32"),
        sa.Column("contract_name", sa.String(), nullable=False, server_default="Tarifa Possibility"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("supply_id", sa.String(), sa.ForeignKey("supplies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("number", sa.String(), nullable=False, unique=True),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", invoice_status, nullable=False, server_default="PENDIENTE"),
        sa.Column("pdf_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_invoices_supply_id", "invoices", ["supply_id"])
    op.create_index("ix_invoices_issued_at", "invoices", ["issued_at"])

    op.create_table(
        "consumption",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("supply_id", sa.String(), sa.ForeignKey("supplies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("total_kwh", sa.Numeric(10, 2), nullable=False),
        sa.Column("change_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hourly_profile", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("supply_id", "year", "month", name="uq_consumption_supply_year_month"),
    )
    op.create_index("ix_consumption_supply_id", "consumption", ["supply_id"])


def downgrade() -> None:
    op.drop_index("ix_consumption_supply_id", table_name="consumption")
    op.drop_table("consumption")
    op.drop_index("ix_invoices_issued_at", table_name="invoices")
    op.drop_index("ix_invoices_supply_id", table_name="invoices")
    op.drop_table("invoices")
    op.drop_table("tariffs")
    op.drop_index("ix_supplies_user_id", table_name="supplies")
    op.drop_table("supplies")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    sa.Enum(name="invoice_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="supply_type").drop(op.get_bind(), checkfirst=True)
