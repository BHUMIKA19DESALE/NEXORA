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
    
    # Remove lines containing href="#"
    lines = content.split('\n')
    new_lines = [line for line in lines if 'href="#"' not in line]
    new_content = '\n'.join(new_lines)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Removed dead links in {os.path.basename(file_path)}')
