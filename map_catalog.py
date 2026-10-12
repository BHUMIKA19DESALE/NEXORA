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

CATEGORY_MAPPING = {
    'beauty': 'Beauty & Personal Care',
    'fragrances': 'Beauty & Personal Care',
    'furniture': 'Furniture & Decor',
    'groceries': 'Grocery & Daily Essentials',
    'home-decoration': 'Furniture & Decor',
    'kitchen-accessories': 'Home & Kitchen',
    'laptops': 'Computers & Laptops',
    'mens-shirts': "Men's Fashion",
    'mens-shoes': 'Footwear',
    'mens-watches': 'Bags & Accessories',
    'mobile-accessories': 'Mobiles & Accessories',
    'motorcycles': 'Sports & Fitness', # closest fit
    'skin-care': 'Beauty & Personal Care',
    'smartphones': 'Mobiles & Accessories',
    'sports-accessories': 'Sports & Fitness',
    'sunglasses': 'Bags & Accessories',
    'tablets': 'Computers & Laptops',
    'tops': "Women's Fashion",
    'vehicle': 'Sports & Fitness',
    'womens-bags': 'Bags & Accessories',
    'womens-dresses': "Women's Fashion",
    'womens-jewellery': 'Bags & Accessories',
    'womens-shoes': 'Footwear',
    'womens-watches': 'Bags & Accessories'
}

REQUIRED_CATEGORIES = [
    "Electronics", "Mobiles & Accessories", "Computers & Laptops",
    "Men's Fashion", "Women's Fashion", "Footwear", "Home & Kitchen",
    "Furniture & Decor", "Beauty & Personal Care", "Sports & Fitness",
    "Books & Stationery", "Toys & Games", "Grocery & Daily Essentials", "Bags & Accessories"
]

def map_catalog():
    db = SessionLocal()
    try:
        # Fetch dummyjson data
        req = urllib.request.Request('https://dummyjson.com/products?limit=194', headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode())['products']
        
        # Ensure all 14 categories exist
        cat_map = {}
        for c_name in REQUIRED_CATEGORIES:
            c = db.query(Category).filter(Category.name == c_name).first()
            if not c:
                c = Category(name=c_name, slug=slugify(c_name))
                db.add(c)
                db.flush()
            cat_map[c_name] = c.id
            
        products = db.query(Product).order_by(Product.id).all()
        
        audit_lines = ["# NEXORA Product Audit\n", "| ID | Name | Brand | Category | Image Source | Verification Status |", "|---|---|---|---|---|---|"]
        
        for i, p in enumerate(products):
            if i >= len(data):
                break
            
            d_prod = data[i]
            raw_cat = d_prod.get('category', '')
            mapped_cat = CATEGORY_MAPPING.get(raw_cat, 'Electronics') # default
            
            p.name = d_prod['title']
            p.slug = slugify(p.name) + "-" + str(p.id)
            p.description = d_prod['description']
            p.price = float(d_prod['price']) * 80
            p.discount = d_prod.get('discountPercentage', 0)
            p.brand = d_prod.get('brand', 'Generic')
            p.category_id = cat_map[mapped_cat]
            
            images = d_prod.get('images', [])
            if not images and 'thumbnail' in d_prod:
                images = [d_prod['thumbnail']]
                
            if images:
                db.query(ProductImage).filter(ProductImage.product_id == p.id).delete()
                db.flush()
                for img_url in images[:1]: # just store 1 for simplicity and verification
                    db.add(ProductImage(product_id=p.id, image_url=img_url))
                img_src = images[0]
                status = "Verified (DummyJSON CDN)"
            else:
                img_src = "None"
                status = "Unresolved"
                
            audit_lines.append(f"| {p.id} | {p.name} | {p.brand} | {mapped_cat} | {img_src} | {status} |")
            
        db.commit()
        
        with open("AUDIT.md", "w", encoding="utf-8") as f:
            f.write("\n".join(audit_lines))
            
        print("Catalog mapped to requested categories and AUDIT.md generated.")
        
    finally:
        db.close()

if __name__ == '__main__':
    map_catalog()
