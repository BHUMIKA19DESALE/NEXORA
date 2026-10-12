import os
import re

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

existing_pages = [f.replace(frontend_dir, '').replace('\\', '/') for f in html_files]

broken_links = []
link_pattern = re.compile(r'href=[\'\"](/pages/[^\'\"]+)[\'\"]')

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        links = link_pattern.findall(content)
        for link in links:
            # ignore query params for checking existence
            base_link = link.split('?')[0]
            if base_link not in existing_pages:
                broken_links.append((file_path, link))

for file_path, link in broken_links:
    print(f'Broken link in {os.path.basename(file_path)}: {link}')
