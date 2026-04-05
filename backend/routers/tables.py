from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

import schemas, crud
from database import get_db

router = APIRouter(prefix="/tables", tags=["Tables"])

@router.get("/", response_model=List[schemas.RestaurantTableOut])
async def read_tables(db: AsyncSession = Depends(get_db)):
    tables = await crud.get_tables(db)
    return tables

@router.post("/", response_model=schemas.RestaurantTableOut)
async def create_table(table: schemas.RestaurantTableCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_table(db, table)
