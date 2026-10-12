import re
from backend.database import SessionLocal
from backend.models import Product

def clean_catalog():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        cleaned_count = 0
        for p in products:
            # Match random hex suffixes like " a1b2c3" at the end of the name
            # Suffixes added earlier were 6 hex digits
            original_name = p.name
            new_name = re.sub(r' [a-f0-9]{6}$', '', original_name)
            if new_name != original_name:
                p.name = new_name
                cleaned_count += 1
                
        db.commit()
        print(f"Cleaned {cleaned_count} product names by removing random hex suffixes.")
        
    finally:
        db.close()

if __name__ == '__main__':
    clean_catalog()
