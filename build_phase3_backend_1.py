import os

SCHEMAS_ADDITIONS = """
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    price: float
    discount: float
    description: Optional[str] = None
    brand: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int

class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    address_id: UUID
    payment_method: str

class OrderResponse(BaseModel):
    id: UUID
    total_amount: float
    grand_total: float
    status: str
    payment_status: str

    class Config:
        from_attributes = True
"""

with open("backend/schemas.py", "a") as f:
    f.write(SCHEMAS_ADDITIONS)

CATEGORIES_ROUTER = """
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db

router = APIRouter()

@router.get("/", response_model=list[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).filter(models.Category.is_active == True).all()
"""

PRODUCTS_ROUTER = """
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from typing import Optional
from uuid import UUID

router = APIRouter()

@router.get("/", response_model=list[schemas.ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    category_id: Optional[UUID] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(models.Product).filter(models.Product.status == "APPROVED")
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if brand:
        query = query.filter(models.Product.brand.ilike(f"%{brand}%"))
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    
    return query.limit(50).all()

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
"""

# Write routers
os.makedirs("backend/routers", exist_ok=True)
with open("backend/routers/categories.py", "w") as f:
    f.write(CATEGORIES_ROUTER)
with open("backend/routers/products.py", "w") as f:
    f.write(PRODUCTS_ROUTER)

print("Phase 3 backend scaffolding (Part 1) done")
