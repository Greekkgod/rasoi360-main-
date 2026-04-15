from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

import schemas, crud
from database import get_db
from dependencies import require_staff
import models

router = APIRouter(prefix="/tables", tags=["Tables"])

@router.get("/", response_model=List[schemas.RestaurantTableOut])
async def read_tables(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(require_staff)):
    tables = await crud.get_tables(db)
    return tables

@router.post("/", response_model=schemas.RestaurantTableOut)
async def create_table(table: schemas.RestaurantTableCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(require_staff)):
    return await crud.create_table(db, table)
