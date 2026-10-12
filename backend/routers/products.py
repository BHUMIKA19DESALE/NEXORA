
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_vendor
from typing import Optional
from uuid import UUID

router = APIRouter()

@router.get("", response_model=list[schemas.ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    category_id: Optional[UUID] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    deals: Optional[bool] = None
):
    query = db.query(models.Product).filter(models.Product.status == "APPROVED")
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if brand:
        query = query.filter(models.Product.brand.ilike(f"%{brand}%"))
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    if deals:
        query = query.filter(models.Product.discount > 0)
    
    return query.limit(50).all()

@router.get("/me", response_model=list[schemas.ProductResponse])
def get_my_products(db: Session = Depends(get_db), current_vendor: models.User = Depends(get_current_vendor)):
    vendor_profile = db.query(models.VendorProfile).filter(models.VendorProfile.user_id == current_vendor.id).first()
    if not vendor_profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return db.query(models.Product).filter(models.Product.vendor_id == vendor_profile.id).all()

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/slug/{slug}", response_model=schemas.ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

from backend.routers.auth import get_current_vendor
import uuid
import re

def generate_slug(name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f"{slug}-{str(uuid.uuid4())[:8]}"

@router.post("", response_model=schemas.ProductResponse)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_vendor: models.User = Depends(get_current_vendor)):
    vendor_profile = db.query(models.VendorProfile).filter(models.VendorProfile.user_id == current_vendor.id).first()
    if not vendor_profile or vendor_profile.status != models.VendorStatusEnum.APPROVED:
        raise HTTPException(status_code=403, detail="Vendor not approved or profile missing.")
    
    product = models.Product(
        vendor_id=vendor_profile.id,
        category_id=product_in.category_id,
        name=product_in.name,
        slug=generate_slug(product_in.name),
        description=product_in.description,
        brand=product_in.brand,
        price=product_in.price,
        discount=product_in.discount,
        status=models.ProductStatusEnum.PENDING
    )
    db.add(product)
    db.flush() # get product ID
    
    inventory = models.Inventory(
        product_id=product.id,
        stock=product_in.stock,
        available_stock=product_in.stock
    )
    db.add(inventory)

    if product_in.image_url:
        img = models.ProductImage(product_id=product.id, image_url=product_in.image_url, is_primary=True)
        db.add(img)
    db.commit()
    db.refresh(product)
    return product
