from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

import schemas, crud
from database import get_db
from dependencies import require_admin
import models

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/")
async def create_payment(payment: schemas.PaymentCreate, db: AsyncSession = Depends(get_db), user: models.User = Depends(require_admin)):
    order = await crud.get_order_by_id(db, payment.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db_payment = await crud.create_payment(db, payment)
    if not db_payment:
        raise HTTPException(status_code=400, detail="Invalid payment or order already paid")
    
    # Calculate remaining
    payment_stmt = select(func.sum(models.Payment.amount)).where(models.Payment.order_id == payment.order_id)
    payment_result = await db.execute(payment_stmt)
    total_paid_already = payment_result.scalar() or 0.0
    
    remaining = order.final_total - total_paid_already
    
    return {
        "payment": schemas.PaymentOut.model_validate(db_payment),
        "remaining_balance": round(max(0, remaining), 2),
        "order_status": "paid" if remaining <= 0 else "partially_paid"
    }
