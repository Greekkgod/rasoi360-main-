import asyncio
import os
os.environ['SQLALCHEMY_SILENCE_UBER_WARNING'] = '1'
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./rasoi360.db"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check():
    output = []
    async with async_session_maker() as s:
        # Check all tables and their columns
        for table in ['orders', 'payments', 'kots', 'kot_items', 'categories', 'menu_items', 'restaurant_tables', 'kitchen_stations', 'users', 'roles', 'inventory_items', 'inventory_logs', 'aggregator_configs']:
            try:
                r = await s.execute(text(f"PRAGMA table_info({table})"))
                cols = r.fetchall()
                if cols:
                    output.append(f"{table}: {[c[1] for c in cols]}")
                else:
                    output.append(f"{table}: TABLE DOES NOT EXIST")
            except Exception as e:
                output.append(f"{table}: ERROR - {e}")
        
        # Try loading orders with ORM
        try:
            import models, schemas
            from sqlalchemy.orm import selectinload
            from sqlalchemy.future import select
            stmt = (
                select(models.Order)
                .options(
                    selectinload(models.Order.kots)
                    .selectinload(models.KOT.items)
                    .selectinload(models.KOTItem.menu_item)
                )
                .order_by(models.Order.id.desc())
            )
            result = await s.execute(stmt)
            orders = result.scalars().all()
            output.append(f"\nORM orders query OK - {len(orders)} orders")
            for o in orders:
                output.append(f"  Order {o.id}: table={o.table_id}, status={o.status}, total={o.total_amount}")
        except Exception as e:
            output.append(f"\nORM orders query FAILED: {type(e).__name__}: {e}")

    with open("debug_output.txt", "w") as f:
        f.write("\n".join(output))

asyncio.run(check())
