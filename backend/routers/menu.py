from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

import schemas, crud
from database import get_db
from dependencies import require_admin, get_current_restaurant
from redis_client import get_menu_cache, set_menu_cache, invalidate_menu_cache
import models

router = APIRouter(prefix="/menu", tags=["Menu"])

@router.get("/public/{slug}", response_model=List[schemas.CategoryWithItemsOut])
async def get_public_menu(slug: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — no auth required. Fetches menu for a specific restaurant by slug."""
    # Find restaurant by slug
    result = await db.execute(select(models.Restaurant).where(models.Restaurant.slug == slug))
    restaurant = result.scalar_one_or_none()
    
    if not restaurant or restaurant.subscription_status == "expired":
        raise HTTPException(status_code=404, detail="Restaurant not found or inactive")
        
    cached_menu = await get_menu_cache(restaurant.id)
    if cached_menu:
        return cached_menu
    
    categories = await crud.get_categories(db, restaurant.id)
    jsonable_data = [schemas.CategoryWithItemsOut.model_validate(c).model_dump() for c in categories]
    await set_menu_cache(restaurant.id, jsonable_data)
    return categories

@router.get("/", response_model=List[schemas.CategoryWithItemsOut])
async def get_menu(
    db: AsyncSession = Depends(get_db),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    """Authenticated endpoint for staff/admin to view their restaurant's menu."""
    cached_menu = await get_menu_cache(restaurant.id)
    if cached_menu:
        return cached_menu
    
    categories = await crud.get_categories(db, restaurant.id)
    jsonable_data = [schemas.CategoryWithItemsOut.model_validate(c).model_dump() for c in categories]
    await set_menu_cache(restaurant.id, jsonable_data)
    return categories

@router.post("/categories", response_model=schemas.CategoryOut)
async def create_category(
    category: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    db_cat = await crud.create_category(db, category, restaurant.id)
    await invalidate_menu_cache(restaurant.id)
    return db_cat

@router.post("/items", response_model=schemas.MenuItemOut)
async def create_menu_item(
    item: schemas.MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    db_item = await crud.create_menu_item(db, item, restaurant.id)
    await invalidate_menu_cache(restaurant.id)
    return db_item

@router.patch("/items/{item_id}", response_model=schemas.MenuItemOut)
async def update_menu_item(
    item_id: int,
    updates: schemas.MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    db_item = await crud.update_menu_item(db, item_id, updates, restaurant.id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await invalidate_menu_cache(restaurant.id)
    return db_item

@router.delete("/items/{item_id}")
async def delete_menu_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    restaurant: models.Restaurant = Depends(get_current_restaurant)
):
    success = await crud.delete_menu_item(db, item_id, restaurant.id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await invalidate_menu_cache(restaurant.id)
    return {"detail": "Item deleted"}
