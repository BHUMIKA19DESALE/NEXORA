from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

class AddressCreate(BaseModel):
    full_name: str
    address_line_1: str
    address_line_2: str = ""
    city: str
    state: str
    postal_code: str
    country: str
    phone: str = ""

class AddressResponse(AddressCreate):
    id: UUID
    class Config:
        from_attributes = True

@router.get("", response_model=list[AddressResponse])
def get_addresses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Address).filter(models.Address.user_id == current_user.id).all()

@router.post("", response_model=AddressResponse)
def create_address(address_in: AddressCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    address = models.Address(**address_in.dict(), user_id=current_user.id)
    db.add(address)
    db.commit()
    db.refresh(address)
    return address
