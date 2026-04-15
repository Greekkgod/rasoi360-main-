from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Menu Items ---
class MenuItemBase(BaseModel):
    name: str
    price: float
    tax_slab: float = 5.0
    is_veg: bool = True
    is_available: bool = True
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    category_id: int

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None

class MenuItemOut(MenuItemBase):
    id: int
    category_id: int
    model_config = ConfigDict(from_attributes=True)

class CategoryWithItemsOut(CategoryOut):
    menu_items: List[MenuItemOut] = []
    model_config = ConfigDict(from_attributes=True)

# --- Tables ---
class RestaurantTableBase(BaseModel):
    table_number: str
    status: str = "Available"

class RestaurantTableCreate(RestaurantTableBase):
    pass

class RestaurantTableOut(RestaurantTableBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Kitchen Stations ---
class KitchenStationBase(BaseModel):
    name: str
    is_active: bool = True

class KitchenStationCreate(KitchenStationBase):
    pass

class KitchenStationOut(KitchenStationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- KOTs & Orders ---
class KOTItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    special_instructions: Optional[str] = None

class KOTItemOut(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    special_instructions: Optional[str] = None
    menu_item: Optional[MenuItemOut] = None
    model_config = ConfigDict(from_attributes=True)

class KOTOut(BaseModel):
    id: int
    order_id: int
    station_id: Optional[int] = None
    status: str
    created_at: Optional[datetime.datetime] = None
    items: List[KOTItemOut] = []
    model_config = ConfigDict(from_attributes=True)

class KOTStatusUpdate(BaseModel):
    status: str  # received, preparing, ready

class OrderCreate(BaseModel):
    table_id: int
    user_id: Optional[int] = None  # Waiter ID (null for customer self-service)
    items: List[KOTItemCreate]

class OrderUpdateStatus(BaseModel):
    status: str

class OrderApplyDiscount(BaseModel):
    discount_amount: float
    discount_type: str  # "flat" or "percentage"

class OrderOut(BaseModel):
    id: int
    table_id: int
    user_id: Optional[int] = None
    status: str
    total_amount: float
    tax_amount: float
    discount_amount: float = 0.0
    discount_type: Optional[str] = None
    final_total: float = 0.0
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class OrderDetailOut(BaseModel):
    id: int
    table_id: int
    user_id: Optional[int] = None
    status: str
    total_amount: float
    tax_amount: float
    kots: List[KOTOut] = []
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str  # draft, kitchen, served, paid

# --- Dashboard Stats ---
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    active_tables: int
    total_tables: int
    avg_order_value: float
    pending_kots: int
    preparing_kots: int
    ready_kots: int

# --- Payments ---
class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    method: str  # "cash", "upi", "card"

class PaymentOut(BaseModel):
    id: int
    order_id: int
    amount: float
    method: str
    status: str
    model_config = ConfigDict(from_attributes=True)

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    gstin: Optional[str] = None
    cgst: float
    sgst: float
    igst: float
    discount_applied: float = 0.0
    total_amount: float
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# --- Auth ---
class LoginRequest(BaseModel):
    identifier: str  # email or phone number
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone_number: str
    role: str
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str
