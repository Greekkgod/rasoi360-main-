from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import schemas, crud
from database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/", response_model=schemas.PaymentOut)
async def receive_payment(payment: schemas.PaymentCreate, db: AsyncSession = Depends(get_db)):
    """Record a payment for an order — marks order as paid and frees the table."""
    try:
        db_payment = await crud.create_payment(db, payment)
        return db_payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
