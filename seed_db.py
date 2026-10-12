import os
import uuid
import random
import time
from backend.database import SessionLocal, engine
from backend.models import User, VendorProfile, Category, Product, ProductImage, RoleEnum, VendorStatusEnum, ProductStatusEnum, Inventory

def seed_db():
    start_time = time.time()
    db = SessionLocal()
    try:
        # Create a Vendor User if none exists
        vendor_user = db.query(User).filter(User.role == RoleEnum.VENDOR).first()
        if not vendor_user:
            vendor_user = User(
                id=uuid.uuid4(),
                email="vendor@example.com",
                hashed_password="hashed_password",
                full_name="Vendor User",
                role=RoleEnum.VENDOR,
                is_active=True
            )
            db.add(vendor_user)
            
            vendor_profile = VendorProfile(
                id=uuid.uuid4(),
                user_id=vendor_user.id,
                store_name="NEXORA Official Store",
                store_description="The official NEXORA store",
                status=VendorStatusEnum.APPROVED
            )
            db.add(vendor_profile)
            db.commit()
        else:
            vendor_profile = db.query(VendorProfile).filter(VendorProfile.user_id == vendor_user.id).first()
            if not vendor_profile:
                vendor_profile = VendorProfile(
                    id=uuid.uuid4(),
                    user_id=vendor_user.id,
                    store_name=f"Vendor {uuid.uuid4().hex[:6]}",
                    store_description="A vendor store",
                    status=VendorStatusEnum.APPROVED
                )
                db.add(vendor_profile)
                db.commit()
                
        # Create Categories
        category_names = ["Electronics", "Fashion", "Home & Garden", "Sports", "Automotive", "Beauty"]
        categories = []
        for name in category_names:
            slug = name.lower().replace(" & ", "-").replace(" ", "-")
            cat = db.query(Category).filter(Category.slug == slug).first()
            if not cat:
                cat = Category(
                    id=uuid.uuid4(),
                    name=name,
                    slug=slug,
                    image_url="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80",
                    is_active=True
                )
                db.add(cat)
                db.commit()
            categories.append(cat)
            
        # Seed Products
        current_product_count = db.query(Product).count()
        if current_product_count >= 150:
            print(f"Database already has {current_product_count} products. Skipping seed.")
            return

        products_to_add = 150 - current_product_count
        print(f"Adding {products_to_add} products...")
        
        brands = ["Sony", "Samsung", "Nike", "Adidas", "Apple", "LG", "Puma", "Dell", "HP", "Canon"]
        adjectives = ["Pro", "Max", "Ultra", "Lite", "Plus", "Advanced", "Premium", "Basic", "Smart"]
        
        for i in range(products_to_add):
            cat = random.choice(categories)
            brand = random.choice(brands)
            adj = random.choice(adjectives)
            
            name = f"{brand} {cat.name} {adj} {uuid.uuid4().hex[:6]}"
            slug = name.lower().replace(" ", "-")
            
            price = random.randint(500, 50000)
            discount = 0.0
            if random.random() > 0.7:  # 30% chance of a discount
                discount = price * random.uniform(0.1, 0.4) # 10% to 40% off
                
            prod_id = uuid.uuid4()
            prod = Product(
                id=prod_id,
                vendor_id=vendor_profile.id,
                category_id=cat.id,
                name=name,
                slug=slug,
                sku=f"SKU-{uuid.uuid4().hex[:8].upper()}",
                description=f"This is a high-quality {name}. It offers premium features at a competitive price point in the {cat.name} category.",
                brand=brand,
                price=price,
                discount=discount,
                status=ProductStatusEnum.APPROVED
            )
            db.add(prod)
            
            # add image
            img = ProductImage(
                id=uuid.uuid4(),
                product_id=prod_id,
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
                is_primary=True
            )
            db.add(img)
            
            # add inventory
            inv = Inventory(
                id=uuid.uuid4(),
                product_id=prod_id,
                stock=random.randint(10, 100),
                reserved_stock=0,
                available_stock=random.randint(10, 100),
                low_stock_threshold=5
            )
            db.add(inv)
            
        print("Committing bulk insert...")
        db.commit()
        
        end_time = time.time()
        print(f"Successfully seeded. Total products now: {db.query(Product).count()}")
        print(f"Time taken: {end_time - start_time:.2f}s")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
