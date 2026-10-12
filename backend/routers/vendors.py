from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from uuid import UUID

router = APIRouter()

@router.post("/register", response_model=schemas.VendorProfileResponse)
def register_vendor(vendor_in: schemas.VendorProfileCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.VendorProfile).filter(models.VendorProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor profile already exists")
        
    existing_store = db.query(models.VendorProfile).filter(models.VendorProfile.store_name == vendor_in.store_name).first()
    if existing_store:
        raise HTTPException(status_code=400, detail="Store name is already taken")
        
    vendor = models.VendorProfile(
        user_id=current_user.id,
        store_name=vendor_in.store_name,
        store_description=vendor_in.store_description,
        business_info=vendor_in.business_info,
        phone=vendor_in.phone,
        status=models.VendorStatusEnum.PENDING
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.get("/me")
def get_vendor_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    vendor = db.query(models.VendorProfile).filter(models.VendorProfile.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Auto-sync role if out of sync (resolves legacy approval bugs), but don't downgrade ADMIN
    if vendor.status == models.VendorStatusEnum.APPROVED and current_user.role == models.RoleEnum.CUSTOMER:
        current_user.role = models.RoleEnum.VENDOR
        db.commit()
        
    return vendor
