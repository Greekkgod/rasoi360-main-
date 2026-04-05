from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

import schemas, crud
from database import get_db
from ws_manager import kds_manager

router = APIRouter(prefix="/kots", tags=["KOTs"])

@router.get("/", response_model=List[schemas.KOTOut])
async def list_active_kots(db: AsyncSession = Depends(get_db)):
    kots = await crud.get_active_kots(db)
    return kots

@router.patch("/{kot_id}/status", response_model=schemas.KOTOut)
async def update_kot_status(kot_id: int, status_update: schemas.KOTStatusUpdate, db: AsyncSession = Depends(get_db)):
    db_kot = await crud.update_kot_status(db, kot_id, status_update.status)
    if not db_kot:
        raise HTTPException(status_code=404, detail="KOT not found")
    
    # Broadcast status update to all KDS clients
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
