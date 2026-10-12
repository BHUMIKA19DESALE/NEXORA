import os
import pathlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import Base, engine
# Base.metadata.create_all(bind=engine) # Removed as per user request to not replace Supabase schema

app = FastAPI(
    title="NEXORA Marketplace API",
    description="Backend API for NEXORA Multi-Vendor E-Commerce Marketplace",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8000"
    ], # Specific origins are required when allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers import (
    auth,
    products,
    categories,
    cart,
    wishlist,
    orders,
    vendors,
    addresses,
    payments,
    admin
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(wishlist.router, prefix="/api/wishlist", tags=["wishlist"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(addresses.router, prefix="/api/addresses", tags=["addresses"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Serve static frontend files
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
frontend_path = BASE_DIR / "frontend"

@app.get("/")
def read_root():
    return FileResponse(frontend_path / "index.html")

app.mount("/", StaticFiles(directory=str(frontend_path)), name="frontend")