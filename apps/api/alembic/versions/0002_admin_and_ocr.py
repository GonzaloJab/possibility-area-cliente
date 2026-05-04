"""admin role, is_active, must_change_password; supply.supplier; invoice.supplier + raw_ocr

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = sa.Enum("ADMIN", "CLIENT", name="user_role")
    user_role.create(op.get_bind(), checkfirst=True)

    op.add_column("users", sa.Column("role", user_role, nullable=False, server_default="CLIENT"))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.add_column("supplies", sa.Column("supplier", sa.String(), nullable=True))

    op.add_column("invoices", sa.Column("supplier", sa.String(), nullable=True))
    op.add_column("invoices", sa.Column("raw_ocr", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("invoices", "raw_ocr")
    op.drop_column("invoices", "supplier")
    op.drop_column("supplies", "supplier")
    op.drop_column("users", "must_change_password")
    op.drop_column("users", "is_active")
    op.drop_column("users", "role")
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)
