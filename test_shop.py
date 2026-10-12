import requests

base_url = "http://127.0.0.1:8000/api"

print("--- Testing Categories ---")
cats = requests.get(f"{base_url}/categories").json()
counts = requests.get(f"{base_url}/categories/counts/inventory").json()

print(f"Loaded {len(cats)} categories from DB.")
count_map = {c["category_id"]: c["count"] for c in counts}
for cat in cats:
    print(f" - {cat['name']} (Count: {count_map.get(cat['id'], 0)})")

print("\n--- Testing Products & Category Filtering ---")
for cat in cats[:3]:
    prods = requests.get(f"{base_url}/products?category_id={cat['id']}").json()
    print(f"Category '{cat['name']}' returned {len(prods)} products. (Expected {count_map.get(cat['id'], 0)})")
    if prods:
        print(f"   First product: {prods[0]['name']}")

print("\n--- Testing Empty Category (if any) ---")
empty_cats = [cat for cat in cats if count_map.get(cat['id'], 0) == 0]
if empty_cats:
    cat = empty_cats[0]
    prods = requests.get(f"{base_url}/products?category_id={cat['id']}").json()
    print(f"Empty category '{cat['name']}' returned {len(prods)} products.")
else:
    print("No empty categories found to test.")

print("\n--- Testing Search ---")
prods = requests.get(f"{base_url}/products?search=Laptop").json()
print(f"Search for 'Laptop' returned {len(prods)} products.")
if prods:
    print(f"   Found: {prods[0]['name']}")

