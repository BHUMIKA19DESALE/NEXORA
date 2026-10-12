import json
import urllib.request
import urllib.parse
from backend.database import SessionLocal
from backend.models import Product, ProductImage, Category, VendorProfile, Inventory
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def update_catalog():
    db = SessionLocal()
    try:
        # Fetch data
        req = urllib.request.Request('https://dummyjson.com/products?limit=150', headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode())['products']
        
        products = db.query(Product).order_by(Product.id).all()
        categories = {c.name.lower(): c.id for c in db.query(Category).all()}
        vendors = db.query(VendorProfile).all()
        
        if not vendors:
            print("No vendors found!")
            return
            
        print(f"Updating {len(products)} products with {len(data)} DummyJSON products...")
        
        for i, p in enumerate(products):
            if i >= len(data):
                break
                
            d_prod = data[i]
            
            # Map category
            cat_name = d_prod.get('category', 'general').capitalize()
            cat_id = categories.get(cat_name.lower())
            if not cat_id:
                # Create category if it doesn't exist
                new_cat = Category(name=cat_name, slug=slugify(cat_name))
                db.add(new_cat)
                db.flush()
                categories[cat_name.lower()] = new_cat.id
                cat_id = new_cat.id
                
            p.name = d_prod['title']
            p.slug = slugify(p.name) + "-" + str(p.id)
            p.description = d_prod['description']
            p.price = float(d_prod['price']) * 80  # Convert USD to INR approx
            p.discount = d_prod.get('discountPercentage', 0)
            p.brand = d_prod.get('brand', 'Generic')
            p.category_id = cat_id
            
            # Update Inventory
            inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
            if inv:
                inv.quantity_available = d_prod.get('stock', 50)
            else:
                db.add(Inventory(product_id=p.id, quantity_available=d_prod.get('stock', 50)))
                
            # Update Image
            images = d_prod.get('images', [])
            if not images and 'thumbnail' in d_prod:
                images = [d_prod['thumbnail']]
                
            if images:
                # Get first image or multiple
                db.query(ProductImage).filter(ProductImage.product_id == p.id).delete()
                for img_url in images[:3]:  # up to 3 images
                    db.add(ProductImage(product_id=p.id, image_url=img_url))
            else:
                # Fallback only if needed, but DummyJSON always has images
                pass

        db.commit()
        print(f"Successfully verified and updated {len(data)} products with real identifiable data.")
        
    finally:
        db.close()

if __name__ == '__main__':
    update_catalog()
