from fastapi.testclient import TestClient
from backend.main import app
import string
import random

client = TestClient(app)

def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def run_tests():
    print("Testing /docs...")
    response = client.get("/docs")
    assert response.status_code == 200, "Docs failed"
    print("/docs successful!")
    
    email = f"test_{random_string()}@example.com"
    password = "StrongPassword123!"
    
    print("Testing customer registration...")
    reg_data = {
        "email": email,
        "full_name": "Test User",
        "password": password,
        "role": "CUSTOMER"
    }
    response = client.post("/api/auth/register", json=reg_data)
    if response.status_code != 200:
        print(f"Registration failed: {response.json()}")
        return False
    print("Registration successful!")
    
    print("Testing customer login...")
    login_data = {
        "username": email,
        "password": password
    }
    response = client.post("/api/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.json()}")
        return False
    token = response.json()["access_token"]
    print("Login successful! JWT generated.")
    
    return True

if __name__ == "__main__":
    import sys
    if run_tests():
        sys.exit(0)
    else:
        sys.exit(1)
