from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

import schemas, crud
from database import get_db
from ws_manager import kds_manager
from dependencies import require_staff
import models

from dependencies import require_staff, get_current_restaurant

router = APIRouter(prefix="/kots", tags=["KOTs"])

@router.get("/", response_model=List[schemas.KOTOut])
async def list_active_kots(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_staff),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    kots = await crud.get_active_kots(db, restaurant.id)
    return kots

@router.get("/stations", response_model=List[schemas.KitchenStationOut])
async def list_stations(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_staff),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    stations = await crud.get_stations(db, restaurant.id)
    return stations

@router.post("/stations", response_model=schemas.KitchenStationOut)
async def create_station(
    station_in: schemas.KitchenStationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    station = await crud.create_kitchen_station(db, station_in, restaurant.id)
    return station

@router.patch("/{kot_id}/status", response_model=schemas.KOTOut)
async def update_kot_status(
    kot_id: int,
    status_update: schemas.KOTStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_staff),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    db_kot = await crud.update_kot_status(db, kot_id, status_update.status, restaurant.id)
    if not db_kot:
        raise HTTPException(status_code=404, detail="KOT not found")
    
    # Broadcast status update to all KDS clients (ideally scoped to restaurant room)
    await kds_manager.broadcast_json({
        "type": "KOT_STATUS_UPDATE",
        "data": {
            "id": db_kot.id,
            "order_id": db_kot.order_id,
            "status": db_kot.status,
            "station_id": db_kot.station_id,
        }
    })
    
    return db_kot
