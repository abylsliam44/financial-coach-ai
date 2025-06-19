"""add_user_stats_and_transaction_user_id

Revision ID: f43271a41b9d
Revises: 5b9211cdbe5c
Create Date: 2025-06-19 04:39:12.136922

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f43271a41b9d'
down_revision = '5b9211cdbe5c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add user_id column as nullable
    op.add_column('transactions', sa.Column('user_id', sa.UUID(), nullable=True))

    # 2. Delete all existing transactions (since they have no user_id)
    op.execute("DELETE FROM transactions")

    # 3. Alter user_id to be non-nullable
    op.alter_column('transactions', 'user_id', nullable=False)

    # 4. Add foreign key constraint
    op.create_foreign_key(
        'fk_transactions_user_id_users',
        'transactions', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # 5. Create user_stats table
    op.create_table(
        'user_stats',
        sa.Column('id', sa.UUID(), primary_key=True, nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('xp', sa.Integer(), nullable=False, default=0),
        sa.Column('level', sa.Integer(), nullable=False, default=1),
        sa.Column('streak', sa.Integer(), nullable=False, default=0),
        sa.Column('total_minutes_lost', sa.Integer(), nullable=False, default=0),
        sa.Column('last_transaction_date', sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('user_stats')
    op.drop_constraint('fk_transactions_user_id_users', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'user_id')