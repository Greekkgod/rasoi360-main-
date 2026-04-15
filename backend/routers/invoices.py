from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import datetime
import io

import models, crud
from database import get_db
from dependencies import require_staff

try:
    from reportlab.pdfgen import canvas
except ImportError:
    pass

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/order/{order_id}/pdf")
async def download_invoice_pdf(order_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Invoice).where(models.Invoice.order_id == order_id)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found. Has this order been paid?")
        
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order details not found")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, 800, "TAX INVOICE")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 770, f"Invoice No: {invoice.invoice_number}")
    c.drawString(50, 750, f"Date: {invoice.created_at.strftime('%Y-%m-%d %H:%M')}")
    if invoice.gstin:
        c.drawString(50, 730, f"GSTIN: {invoice.gstin}")
        
    c.drawString(50, 700, "-" * 80)
    c.drawString(50, 680, "Item")
    c.drawString(300, 680, "Qty")
    c.drawString(400, 680, "Price")
    c.drawString(500, 680, "Total")
    c.drawString(50, 660, "-" * 80)
    
    y = 640
    # Gather kots and items
    for kot in order.kots:
        for item in kot.items:
            c.drawString(50, y, str(item.menu_item.name)[:30])
            c.drawString(300, y, str(item.quantity))
            c.drawString(400, y, f"{item.menu_item.price:.2f}")
            c.drawString(500, y, f"{(item.quantity * item.menu_item.price):.2f}")
            y -= 20
            
    c.drawString(50, y-10, "-" * 80)
    y -= 30
    
    c.drawString(350, y, f"Subtotal:")
    c.drawString(500, y, f"{(order.total_amount):.2f}")
    y -= 20
    
    if invoice.discount_applied > 0:
        c.drawString(350, y, f"Discount:")
        c.drawString(500, y, f"-{invoice.discount_applied:.2f}")
        y -= 20
    
    c.drawString(350, y, f"CGST:")
    c.drawString(500, y, f"{invoice.cgst:.2f}")
    y -= 20
    
    c.drawString(350, y, f"SGST:")
    c.drawString(500, y, f"{invoice.sgst:.2f}")
    y -= 30
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(350, y, f"Final Total:")
    c.drawString(500, y, f"{invoice.total_amount:.2f}")
    y -= 40
    
    # Payments breakdown
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Payments Received:")
    y -= 20
    c.setFont("Helvetica", 12)
    if order.payments:
        for p in order.payments:
            if p.status == "Completed":
                c.drawString(50, y, f"{p.method.upper()}")
                c.drawString(200, y, f"₹{p.amount:.2f}")
                y -= 20
    
    c.setFont("Helvetica", 10)
    c.drawString(200, 50, "Thank you for dining with Rasoi360!")

    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=Invoice_{invoice.invoice_number.replace('/','_')}.pdf"
    })
