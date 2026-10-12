from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from uuid import UUID
from pydantic import BaseModel

router = APIRouter()

class WishlistItemResponse(BaseModel):
    id: UUID
    product: schemas.ProductResponse
    class Config: from_attributes = True

@router.get("", response_model=list[WishlistItemResponse])
def get_wishlist(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.WishlistItem).filter(models.WishlistItem.user_id == current_user.id).all()

@router.post("/{product_id}")
def add_to_wishlist(product_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == current_user.id,
        models.WishlistItem.product_id == product_id
    ).first()
    if existing:
        return existing
        
    item = models.WishlistItem(user_id=current_user.id, product_id=product_id)
    db.add(item)
    db.commit()
    return item

@router.delete("/{product_id}")
def remove_from_wishlist(product_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == current_user.id,
        models.WishlistItem.product_id == product_id
    ).delete()
    db.commit()
    return {"message": "Item removed"}
