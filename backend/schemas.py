from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from backend.models import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: RoleEnum = RoleEnum.CUSTOMER

class UserResponse(UserBase):
    id: UUID
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

from typing import List, Optional
from datetime import datetime
from uuid import UUID

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class ProductImageResponse(BaseModel):
    id: UUID
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class ProductImageResponse(BaseModel):
    id: UUID
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class InventoryResponse(BaseModel):
    id: UUID
    stock: int
    available_stock: int

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    price: float
    discount: float
    description: Optional[str] = None
    brand: Optional[str] = None
    status: str
    images: List[ProductImageResponse] = []
    inventory: Optional[InventoryResponse] = None

    class Config:
        from_attributes = True

class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int

class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    address_id: UUID
    payment_method: str

class OrderResponse(BaseModel):
    id: UUID
    total_amount: float
    grand_total: float
    status: str
    payment_status: str

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    order_id: UUID
    method: str
    amount: float

class PaymentResponse(BaseModel):
    id: UUID
    order_id: UUID
    reference: str
    method: str
    amount: float
    status: str
    
    class Config:
        from_attributes = True

class PaymentProcess(BaseModel):
    payment_id: UUID
    status: str

from backend.models import VendorStatusEnum

class VendorProfileCreate(BaseModel):
    store_name: str
    store_description: Optional[str] = None
    business_info: Optional[str] = None
    phone: Optional[str] = None

class VendorProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    store_name: str
    store_description: Optional[str] = None
    business_info: Optional[str] = None
    phone: Optional[str] = None
    status: VendorStatusEnum
    created_at: datetime
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: UUID
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    price: float
    discount: float = 0.0
    image_url: Optional[str] = None
    stock: int
