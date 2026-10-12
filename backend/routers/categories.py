from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models, schemas
from backend.database import get_db

router = APIRouter()

@router.get("/counts/inventory")
def get_category_counts(db: Session = Depends(get_db)):
    # Count distinct active/published products represented in the inventory table for each category.
    # Joining with Inventory ensures we only count products that have an inventory record.
    results = db.query(
        models.Category.id,
        models.Category.name,
        func.count(models.Inventory.id).label("count")
    ).join(
        models.Product, models.Category.id == models.Product.category_id
    ).join(
        models.Inventory, models.Product.id == models.Inventory.product_id
    ).filter(
        models.Product.status == "APPROVED",
        models.Category.is_active == True
    ).group_by(
        models.Category.id, models.Category.name
    ).all()
    
    return [{"category_id": str(r[0]), "category": r[1], "count": r[2]} for r in results]


@router.get("", response_model=list[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).filter(models.Category.is_active == True).all()

@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.get("/slug/{slug}", response_model=schemas.CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.slug == slug).first()
    if not category:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Category not found")
    return category
