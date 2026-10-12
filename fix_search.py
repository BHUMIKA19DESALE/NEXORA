import os
import re

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find <div class="search-bar">...</div>
    pattern = re.compile(r'<div class="search-bar">.*?</div>', re.DOTALL)
    
    standard_search = '''<div class="search-bar">
                <form action="/pages/shop.html" method="GET" style="display:flex; width:100%; margin:0; padding:0; border:none; background:transparent;">
                    <input type="text" name="search" placeholder="Search products, brands and more..." style="border:none; flex:1;">
                    <button type="submit" style="border:none; background:transparent; cursor:pointer;"><i class='bx bx-search'></i></button>
                </form>
            </div>'''
            
    new_content = pattern.sub(standard_search, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated search bar in {os.path.basename(file_path)}')
