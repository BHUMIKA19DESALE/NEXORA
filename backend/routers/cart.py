from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from uuid import UUID

router = APIRouter()

@router.get("", response_model=list[schemas.CartItemResponse])
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()

@router.post("/items", response_model=schemas.CartItemResponse)
def add_to_cart(item: schemas.CartItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product or product.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Product not available")
    
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == item.product_id
    ).first()

    requested_qty = item.quantity
    if cart_item:
        requested_qty += cart_item.quantity

    inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
    if not inventory or requested_qty > inventory.available_stock:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

    if cart_item:
        cart_item.quantity += item.quantity
    else:
        cart_item = models.CartItem(
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)
        
    db.commit()
    db.refresh(cart_item)
    return cart_item

@router.delete("/items/{item_id}")
def remove_from_cart(item_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.CartItem).filter(models.CartItem.id == item_id, models.CartItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item removed"}

@router.delete("")
def clear_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}
