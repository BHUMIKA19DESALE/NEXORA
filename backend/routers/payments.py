from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
import uuid
import datetime

router = APIRouter()

@router.post("/create", response_model=schemas.PaymentResponse)
def create_payment(payment_data: schemas.PaymentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == payment_data.order_id).first()
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    payment = models.Payment(
        user_id=current_user.id,
        order_id=payment_data.order_id,
        method=payment_data.method,
        amount=payment_data.amount,
        reference=f"NXR-PAY-{uuid.uuid4().hex[:8].upper()}"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/process", response_model=schemas.PaymentResponse)
def process_payment(payment_data: schemas.PaymentProcess, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_data.payment_id).first()
    if not payment or payment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.status in ["SUCCESS", "REFUNDED"]:
        raise HTTPException(status_code=400, detail="Invalid state transition")
        
    payment.status = payment_data.status
    payment.processed_at = datetime.datetime.now(datetime.timezone.utc)
    
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if order:
        order.payment_status = payment.status
        if payment.status == "SUCCESS":
            order.status = "CONFIRMED"
            # Clear cart on successful payment
            db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
            # Finalize inventory (deduct from reserved, deduct from total stock)
            order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
            for oi in order_items:
                inventory = db.query(models.Inventory).filter(models.Inventory.product_id == oi.product_id).first()
                if inventory:
                    inventory.reserved_stock -= oi.quantity
                    inventory.stock -= oi.quantity
        elif payment.status in ["FAILED", "CANCELLED"]:
            order.status = "CANCELLED"
            # Release reserved inventory back to available stock
            order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
            for oi in order_items:
                inventory = db.query(models.Inventory).filter(models.Inventory.product_id == oi.product_id).first()
                if inventory:
                    inventory.reserved_stock -= oi.quantity
                    inventory.available_stock += oi.quantity
        
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/refund")
def refund_payment(payment_id: uuid.UUID, amount: float, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment or payment.user_id != current_user.id: # Note: strictly speaking we'd check admin
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.status != "SUCCESS":
        raise HTTPException(status_code=400, detail="Cannot refund unpaid payment")
        
    payment.refund_status = "REFUNDED"
    payment.refund_reference = f"NXR-REF-{uuid.uuid4().hex[:8].upper()}"
    payment.refund_amount = amount
    
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if order:
        order.status = "CANCELLED"
        
    db.commit()
    return {"message": "Refund processed successfully", "refund_reference": payment.refund_reference}
