from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import models, schemas
import datetime

# --- Categories & Menu Items ---
async def get_categories(db: AsyncSession):
    stmt = select(models.Category).options(selectinload(models.Category.menu_items))
    result = await db.execute(stmt)
    return result.scalars().all()

async def create_category(db: AsyncSession, category: schemas.CategoryCreate):
    db_cat = models.Category(**category.model_dump())
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat

async def create_menu_item(db: AsyncSession, item: schemas.MenuItemCreate):
    db_item = models.MenuItem(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def update_menu_item(db: AsyncSession, item_id: int, updates: schemas.MenuItemUpdate):
    stmt = select(models.MenuItem).where(models.MenuItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalar_one_or_none()
    if not db_item:
        return None
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def delete_menu_item(db: AsyncSession, item_id: int):
    stmt = select(models.MenuItem).where(models.MenuItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalar_one_or_none()
    if not db_item:
        return False
    await db.delete(db_item)
    await db.commit()
    return True

async def get_menu_items_by_ids(db: AsyncSession, item_ids: list[int]):
    stmt = select(models.MenuItem).where(models.MenuItem.id.in_(item_ids))
    result = await db.execute(stmt)
    return result.scalars().all()

# --- Stations ---
async def get_stations(db: AsyncSession):
    stmt = select(models.KitchenStation).where(models.KitchenStation.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_station_loads(db: AsyncSession):
    """Returns a dict mapping station_id to current item load (active items in KOTs)"""
    stmt = (
        select(models.KOT.station_id, func.count(models.KOTItem.id))
        .join(models.KOTItem)
        .where(models.KOT.status.in_(["received", "preparing"]))
        .group_by(models.KOT.station_id)
    )
    result = await db.execute(stmt)
    loads = {row[0]: row[1] for row in result.all() if row[0] is not None}
    return loads

# --- Tables ---
async def get_tables(db: AsyncSession):
    stmt = select(models.RestaurantTable)
    result = await db.execute(stmt)
    return result.scalars().all()

async def create_table(db: AsyncSession, table: schemas.RestaurantTableCreate):
    db_table = models.RestaurantTable(**table.model_dump())
    db.add(db_table)
    await db.commit()
    await db.refresh(db_table)
    return db_table

async def update_table_status(db: AsyncSession, table_id: int, status: str):
    stmt = select(models.RestaurantTable).where(models.RestaurantTable.id == table_id)
    result = await db.execute(stmt)
    db_table = result.scalar_one_or_none()
    if db_table:
        db_table.status = status
        await db.commit()
        await db.refresh(db_table)
    return db_table

# --- Orders ---
async def get_all_orders(db: AsyncSession):
    stmt = (
        select(models.Order)
        .options(
            selectinload(models.Order.kots)
            .selectinload(models.KOT.items)
            .selectinload(models.KOTItem.menu_item)
        )
        .order_by(models.Order.id.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_order_by_id(db: AsyncSession, order_id: int):
    stmt = (
        select(models.Order)
        .where(models.Order.id == order_id)
        .options(
            selectinload(models.Order.kots)
            .selectinload(models.KOT.items)
            .selectinload(models.KOTItem.menu_item)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_order_status(db: AsyncSession, order_id: int, status: str):
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    db_order = result.scalar_one_or_none()
    if db_order:
        db_order.status = status
        await db.commit()
        await db.refresh(db_order)
    return db_order

async def create_order_with_routing(db: AsyncSession, order_in: schemas.OrderCreate):
    # 1. Get menu items to calculate total
    item_ids = [i.menu_item_id for i in order_in.items]
    menu_items = await get_menu_items_by_ids(db, item_ids)
    menu_item_map = {mi.id: mi for mi in menu_items}

    # Calculate total
    total = 0.0
    for item_in in order_in.items:
        mi = menu_item_map.get(item_in.menu_item_id)
        if mi:
            total += mi.price * item_in.quantity
    tax = round(total * 0.05, 2)  # 5% GST

    # 2. Create the Order
    db_order = models.Order(
        table_id=order_in.table_id,
        user_id=order_in.user_id,
        status="kitchen",
        total_amount=round(total, 2),
        tax_amount=tax
    )
    db.add(db_order)
    await db.flush()

    # 3. Mark table as Occupied
    await update_table_status(db, order_in.table_id, "Occupied")

    # 4. Get current station loads for fallback routing
    stations = await get_stations(db)
    station_loads = await get_station_loads(db)
    
    least_busy_station_id = None
    if stations:
        least_busy_station_id = min(stations, key=lambda s: station_loads.get(s.id, 0)).id

    # 5. Group items by station
    station_items = {}
    for item_in in order_in.items:
        mi = menu_item_map.get(item_in.menu_item_id)
        target_station_id = mi.station_id if mi and mi.station_id else least_busy_station_id
        
        if target_station_id not in station_items:
            station_items[target_station_id] = []
        station_items[target_station_id].append(item_in)

    # 6. Create KOTs for each station
    kots_created = []
    for station_id, items in station_items.items():
        db_kot = models.KOT(
            order_id=db_order.id,
            station_id=station_id,
            status="received"
        )
        db.add(db_kot)
        await db.flush()
        
        for item_in in items:
            db_kot_item = models.KOTItem(
                kot_id=db_kot.id,
                menu_item_id=item_in.menu_item_id,
                quantity=item_in.quantity,
                special_instructions=item_in.special_instructions
            )
            db.add(db_kot_item)
        
        kots_created.append(db_kot)

    await db.commit()
    await db.refresh(db_order)
    
    return db_order, kots_created

# --- KOTs ---
async def get_active_kots(db: AsyncSession):
    stmt = (
        select(models.KOT)
        .where(models.KOT.status.in_(["received", "preparing", "ready"]))
        .options(
            selectinload(models.KOT.items).selectinload(models.KOTItem.menu_item)
        )
        .order_by(models.KOT.created_at.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_kot_status(db: AsyncSession, kot_id: int, status: str):
    stmt = select(models.KOT).where(models.KOT.id == kot_id)
    result = await db.execute(stmt)
    db_kot = result.scalar_one_or_none()
    if db_kot:
        db_kot.status = status
        await db.commit()
        
        # If all KOTs for this order are 'ready', update order status
        if status == "ready":
            order_kots_stmt = select(models.KOT).where(models.KOT.order_id == db_kot.order_id)
            order_kots_result = await db.execute(order_kots_stmt)
            all_kots = order_kots_result.scalars().all()
            if all(k.status == "ready" for k in all_kots):
                await update_order_status(db, db_kot.order_id, "served")
        
        # Re-fetch with eager loading for response
        reload_stmt = (
            select(models.KOT)
            .where(models.KOT.id == kot_id)
            .options(
                selectinload(models.KOT.items).selectinload(models.KOTItem.menu_item)
            )
        )
        reload_result = await db.execute(reload_stmt)
        db_kot = reload_result.scalar_one_or_none()
    return db_kot

# --- Dashboard Stats ---
async def get_dashboard_stats(db: AsyncSession):
    # Total orders
    orders_stmt = select(func.count(models.Order.id))
    orders_result = await db.execute(orders_stmt)
    total_orders = orders_result.scalar() or 0

    # Total revenue
    revenue_stmt = select(func.coalesce(func.sum(models.Order.total_amount + models.Order.tax_amount), 0))
    revenue_result = await db.execute(revenue_stmt)
    total_revenue = float(revenue_result.scalar() or 0)

    # Active tables (Occupied)
    active_stmt = select(func.count(models.RestaurantTable.id)).where(
        models.RestaurantTable.status == "Occupied"
    )
    active_result = await db.execute(active_stmt)
    active_tables = active_result.scalar() or 0

    # Total tables
    total_tables_stmt = select(func.count(models.RestaurantTable.id))
    total_tables_result = await db.execute(total_tables_stmt)
    total_tables = total_tables_result.scalar() or 0

    # Avg order value
    avg_order = total_revenue / total_orders if total_orders > 0 else 0

    # KOT counts by status
    kot_counts = {}
    for status in ["received", "preparing", "ready"]:
        kot_stmt = select(func.count(models.KOT.id)).where(models.KOT.status == status)
        kot_result = await db.execute(kot_stmt)
        kot_counts[status] = kot_result.scalar() or 0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "active_tables": active_tables,
        "total_tables": total_tables,
        "avg_order_value": round(avg_order, 2),
        "pending_kots": kot_counts["received"],
        "preparing_kots": kot_counts["preparing"],
        "ready_kots": kot_counts["ready"],
    }

# --- Payments ---
async def create_payment(db: AsyncSession, payment: schemas.PaymentCreate):
    # Create Payment record
    db_payment = models.Payment(
        order_id=payment.order_id,
        amount=payment.amount,
        method=payment.method,
        status="Completed"
    )
    db.add(db_payment)

    # Mark order as paid
    await update_order_status(db, payment.order_id, "paid")

    # Free up the table
    order_stmt = select(models.Order).where(models.Order.id == payment.order_id)
    order_result = await db.execute(order_stmt)
    db_order = order_result.scalar_one_or_none()
    if db_order:
        await update_table_status(db, db_order.table_id, "Available")

    await db.commit()
    await db.refresh(db_payment)
    return db_payment
