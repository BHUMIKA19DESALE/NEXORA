import os

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('<a href="">Categories</a>', '<a href="/pages/shop.html">Categories</a>')
    new_content = new_content.replace('<a href="#">Categories</a>', '<a href="/pages/shop.html">Categories</a>')
    new_content = new_content.replace('<a href="#">Vendors</a>', '<a href="/pages/vendor-register.html">Vendors</a>')
    new_content = new_content.replace('<a href="#">Deals</a>', '<a href="/pages/shop.html?deals=true">Deals</a>')
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(file_path)}')
