from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user, get_current_admin
from backend.core import security
from uuid import UUID

router = APIRouter()

@router.post("/bootstrap")
def bootstrap_admin(db: Session = Depends(get_db)):
    """
    Creates the initial super-admin account (admin / admin123) if no admin exists.
    """
    admin_exists = db.query(models.User).filter(models.User.role == models.RoleEnum.ADMIN).first()
    if admin_exists:
        raise HTTPException(status_code=400, detail="Admin already exists.")

    user = db.query(models.User).filter(models.User.email == "admin@nexora.com").first()
    if user:
        user.role = models.RoleEnum.ADMIN
    else:
        user = models.User(
            email="admin@nexora.com",
            hashed_password=security.get_password_hash("admin123"),
            full_name="Super Admin",
            role=models.RoleEnum.ADMIN
        )
        db.add(user)
    
    db.commit()
    return {"message": "Admin account initialized. Please log in with admin@nexora.com and change the password immediately."}


@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return db.query(models.User).all()

@router.get("/vendors", response_model=List[schemas.VendorProfileResponse])
def get_all_vendors(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    vendors = db.query(models.VendorProfile).all()
    results = []
    for v in vendors:
        v_dict = {
            "id": v.id,
            "user_id": v.user_id,
            "store_name": v.store_name,
            "store_description": v.store_description,
            "business_info": v.business_info,
            "phone": v.phone,
            "status": v.status,
            "created_at": v.created_at,
            "applicant_name": v.applicant_name,
            "applicant_email": v.applicant_email
        }
        results.append(v_dict)
    return results

@router.post("/vendors/{vendor_id}/approve")
def approve_vendor(vendor_id: UUID, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    vendor = db.query(models.VendorProfile).filter(models.VendorProfile.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.status = models.VendorStatusEnum.APPROVED
    
    user = db.query(models.User).filter(models.User.id == vendor.user_id).first()
    if user:
        user.role = models.RoleEnum.VENDOR
    
    db.commit()
    return {"message": "Vendor approved and role updated."}

@router.post("/vendors/{vendor_id}/reject")
def reject_vendor(vendor_id: UUID, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    vendor = db.query(models.VendorProfile).filter(models.VendorProfile.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.status = models.VendorStatusEnum.REJECTED
    
    db.commit()
    return {"message": "Vendor rejected."}

@router.get("/products")
def get_all_products_admin(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    products = db.query(models.Product).all()
    results = []
    for p in products:
        image_url = p.images[0].image_url if p.images else None
        results.append({
            "id": p.id,
            "name": p.name,
            "category": p.category.name if p.category else "N/A",
            "vendor_store": p.vendor.store_name if p.vendor else "N/A",
            "price": p.price,
            "stock": p.inventory.stock if p.inventory else 0,
            "description": p.description,
            "status": p.status,
            "created_at": p.created_at,
            "image_url": image_url
        })
    return results

@router.post("/products/{product_id}/approve")
def approve_product(product_id: UUID, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = models.ProductStatusEnum.APPROVED
    db.commit()
    return {"message": "Product approved."}

@router.post("/products/{product_id}/reject")
def reject_product(product_id: UUID, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = models.ProductStatusEnum.REJECTED
    db.commit()
    return {"message": "Product rejected."}

