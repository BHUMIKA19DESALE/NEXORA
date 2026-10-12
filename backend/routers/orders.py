from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from uuid import UUID

router = APIRouter()

@router.get("", response_model=list[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Order).filter(models.Order.user_id == current_user.id).all()

@router.post("", response_model=schemas.OrderResponse)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Fetch cart items
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # 2. Calculate totals and check inventory
    total_amount = 0
    order_items_to_create = []
    
    for item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product or product.status != "APPROVED":
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} is unavailable")
            
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
        if not inventory or inventory.available_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            
        # Reserve inventory safely
        inventory.available_stock -= item.quantity
        inventory.reserved_stock += item.quantity
        
        subtotal = (product.price - product.discount) * item.quantity
        total_amount += subtotal
        
        order_items_to_create.append(models.OrderItem(
            product_id=product.id,
            vendor_id=product.vendor_id,
            quantity=item.quantity,
            unit_price=product.price - product.discount,
            subtotal=subtotal
        ))
        
    shipping_amount = 10.0 if total_amount < 100 else 0.0
    grand_total = total_amount + shipping_amount
    
    # 3. Create order
    order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        shipping_amount=shipping_amount,
        grand_total=grand_total,
        status="PLACED",
        payment_status="PENDING"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # 4. Attach order items
    for oi in order_items_to_create:
        oi.order_id = order.id
        db.add(oi)
        
    # NOTE: Cart is NOT cleared here. It will be cleared upon successful payment.
    db.commit()
    db.refresh(order)
    return order
