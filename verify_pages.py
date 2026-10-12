import os
import urllib.request

frontend_dir = r'D:\NEXORA\frontend'
html_files = []
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

base_url = 'http://127.0.0.1:8000'
results = []
failures = 0

for file_path in html_files:
    rel_path = file_path.replace(frontend_dir, '').replace('\\', '/')
    url = base_url + rel_path
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            status = response.status
            content_type = response.getheader('Content-Type')
            content = response.read().decode('utf-8')
            
            if status == 200 and 'text/html' in content_type and '<html' in content:
                results.append((url, "OK", status, content_type))
            else:
                results.append((url, "FAIL (Bad Content)", status, content_type))
                failures += 1
    except Exception as e:
        results.append((url, f"FAIL ({e})", 0, ""))
        failures += 1

print(f"Verified {len(html_files)} HTML pages:")
for url, res, status, ctype in results:
    print(f"{url} -> {res} (Status: {status}, Type: {ctype})")

# Test API
try:
    req = urllib.request.Request(base_url + '/api/categories')
    with urllib.request.urlopen(req) as response:
        status = response.status
        content_type = response.getheader('Content-Type')
        print(f"\nAPI Test /api/categories -> OK (Status: {status}, Type: {content_type})")
except Exception as e:
    print(f"\nAPI Test /api/categories -> FAIL ({e})")
    failures += 1

import sys
if failures > 0:
    sys.exit(1)
