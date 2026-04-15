from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import schemas, crud
from database import get_db
from dependencies import require_admin
import models

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(require_admin)):
    stats = await crud.get_dashboard_stats(db)
    return stats
