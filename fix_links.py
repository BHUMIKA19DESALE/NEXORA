import os
import re

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

# Pages that don't exist
broken_links_regex = [r'href=[\'\"]/pages/categories\.html[\'\"]', r'href=[\'\"]/pages/vendors\.html[\'\"]', r'href=[\'\"]/pages/deals\.html[\'\"]']

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified_content = content
    for pattern in broken_links_regex:
        modified_content = re.sub(pattern, 'href="#"', modified_content)
        
    if modified_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        print(f'Fixed links in {os.path.basename(file_path)}')
