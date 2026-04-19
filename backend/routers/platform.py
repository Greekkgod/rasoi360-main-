from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel, ConfigDict
import datetime

from database import get_db
import models
from dependencies import require_superuser

router = APIRouter(prefix="/platform", tags=["Platform Admin"])

class RestaurantOut(BaseModel):
    id: int
    name: str
    slug: str
    subscription_status: str
    trial_ends_at: datetime.datetime | None = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class RestaurantStatusUpdate(BaseModel):
    subscription_status: str # trial, active, expired
    extend_trial_days: int | None = None

@router.get("/restaurants", response_model=List[RestaurantOut])
async def list_all_restaurants(
    db: AsyncSession = Depends(get_db),
    superuser: models.User = Depends(require_superuser)
):
    """Get all restaurants registered on the platform."""
    result = await db.execute(select(models.Restaurant).order_by(models.Restaurant.created_at.desc()))
    return result.scalars().all()

@router.patch("/restaurants/{restaurant_id}/status", response_model=RestaurantOut)
async def update_restaurant_status(
    restaurant_id: int,
    update_data: RestaurantStatusUpdate,
    db: AsyncSession = Depends(get_db),
    superuser: models.User = Depends(require_superuser)
):
    """Update a restaurant's subscription status or extend their trial."""
    result = await db.execute(select(models.Restaurant).where(models.Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    restaurant.subscription_status = update_data.subscription_status
    
    if update_data.extend_trial_days and restaurant.trial_ends_at:
        restaurant.trial_ends_at = restaurant.trial_ends_at + datetime.timedelta(days=update_data.extend_trial_days)
        
    await db.commit()
    await db.refresh(restaurant)
    return restaurant
