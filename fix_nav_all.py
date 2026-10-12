import os
import re

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

correct_nav_links = '''            <nav class="nav-links">
                <a href="/">Home</a>
                <a href="/pages/shop.html">Shop</a>
                <a href="/pages/shop.html">Categories</a>
                <a href="/pages/vendor-register.html">Vendors</a>
                <a href="/pages/shop.html?deals=true">Deals</a>
            </nav>'''

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace anything inside <nav class="nav-links"> ... </nav> with correct_nav_links
    new_content = re.sub(r'<nav class="nav-links">.*?</nav>', correct_nav_links, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(file_path)}')
