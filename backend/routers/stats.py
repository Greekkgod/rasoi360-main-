from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import schemas, crud
from database import get_db

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    stats = await crud.get_dashboard_stats(db)
    return stats
