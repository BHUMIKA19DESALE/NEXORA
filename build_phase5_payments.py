import os

models_code = """
class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    reference = Column(String, unique=True, index=True)
    method = Column(String)
    amount = Column(Float)
    currency = Column(String, default="INR")
    status = Column(String, default="CREATED")
    refund_status = Column(String)
    refund_reference = Column(String)
    refund_amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
"""

with open("backend/models.py", "a") as f:
    f.write(models_code)

schemas_code = """
class PaymentCreate(BaseModel):
    order_id: UUID
    method: str
    amount: float

class PaymentResponse(BaseModel):
    id: UUID
    order_id: UUID
    reference: str
    method: str
    amount: float
    status: str
    
    class Config:
        from_attributes = True

class PaymentProcess(BaseModel):
    payment_id: UUID
    status: str
"""

with open("backend/schemas.py", "a") as f:
    f.write(schemas_code)

payments_router_code = """
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
        order.payment_method = payment.method
        order.payment_reference = payment.reference
        if payment.status == "SUCCESS":
            order.status = "CONFIRMED"
        
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/refund")
def refund_payment(payment_id: uuid.UUID, amount: float, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment or payment.user_id != current_user.id: # In reality admin/vendor rules apply too
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.status != "SUCCESS":
        raise HTTPException(status_code=400, detail="Cannot refund unpaid payment")
        
    payment.refund_status = "REFUNDED"
    payment.refund_reference = f"NXR-REF-{uuid.uuid4().hex[:8].upper()}"
    payment.refund_amount = amount
    
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if order:
        order.refund_status = "REFUNDED"
        order.refund_reference = payment.refund_reference
        order.status = "CANCELLED"
        
    db.commit()
    return {"message": "Refund processed successfully", "refund_reference": payment.refund_reference}
"""

with open("backend/routers/payments.py", "w") as f:
    f.write(payments_router_code)

main_py_update = """
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
"""

with open("backend/main.py", "r") as f:
    content = f.read()

content = content.replace(
    "from backend.routers import auth, products, categories, cart, wishlist, orders, vendors, addresses",
    "from backend.routers import auth, products, categories, cart, wishlist, orders, vendors, addresses, payments"
)
content = content.replace(
    "app.include_router(addresses.router, prefix=\\"/api/addresses\\", tags=[\\"addresses\\"])",
    "app.include_router(addresses.router, prefix=\\"/api/addresses\\", tags=[\\"addresses\\"])\\napp.include_router(payments.router, prefix=\\"/api/payments\\", tags=[\\"payments\\"])"
)

with open("backend/main.py", "w") as f:
    f.write(content)

print("Files generated.")
