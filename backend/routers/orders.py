from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import datetime

import schemas, crud
from database import get_db
from ws_manager import kds_manager

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/", response_model=List[schemas.OrderDetailOut])
async def list_orders(db: AsyncSession = Depends(get_db)):
    orders = await crud.get_all_orders(db)
    return orders

@router.get("/{order_id}", response_model=schemas.OrderDetailOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=schemas.OrderOut)
async def create_order(order_in: schemas.OrderCreate, db: AsyncSession = Depends(get_db)):
    db_order, kots = await crud.create_order_with_routing(db, order_in)
    
    # Broadcast to KDS via WebSocket
    for kot in kots:
        # Reload KOT with items eagerly loaded
        loaded_kot = None
        from sqlalchemy.future import select
        from sqlalchemy.orm import selectinload
        import models
        stmt = (
            select(models.KOT)
            .where(models.KOT.id == kot.id)
            .options(selectinload(models.KOT.items).selectinload(models.KOTItem.menu_item))
        )
        result = await db.execute(stmt)
        loaded_kot = result.scalar_one_or_none()
        
        if loaded_kot:
            kot_payload = {
                "type": "NEW_KOT",
                "data": {
                    "id": loaded_kot.id,
                    "order_id": db_order.id,
                    "table_id": db_order.table_id,
                    "station_id": loaded_kot.station_id,
                    "status": loaded_kot.status,
                    "created_at": str(loaded_kot.created_at) if loaded_kot.created_at else str(datetime.datetime.utcnow()),
                    "items": [
                        {
                            "id": item.id,
                            "menu_item_id": item.menu_item_id,
                            "quantity": item.quantity,
                            "special_instructions": item.special_instructions,
                            "menu_item": {
                                "id": item.menu_item.id,
                                "name": item.menu_item.name,
                                "price": item.menu_item.price,
                                "is_veg": item.menu_item.is_veg,
                                "is_available": item.menu_item.is_available,
                                "image_url": item.menu_item.image_url,
                                "category_id": item.menu_item.category_id,
                            } if item.menu_item else None,
                        } for item in loaded_kot.items
                    ],
                }
            }
            
            if loaded_kot.station_id:
                await kds_manager.send_to_station(loaded_kot.station_id, kot_payload)
            else:
                await kds_manager.broadcast_json(kot_payload)
    
    return db_order

@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
async def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: AsyncSession = Depends(get_db)):
    db_order = await crud.update_order_status(db, order_id, status_update.status)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If order is paid, free up the table
    if status_update.status == "paid":
        await crud.update_table_status(db, db_order.table_id, "Available")
    
    return db_order
