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
    user_id: int  # Waiter ID
    items: List[KOTItemCreate]

class OrderOut(BaseModel):
    id: int
    table_id: int
    user_id: int
    status: str
    total_amount: float
    tax_amount: float
    model_config = ConfigDict(from_attributes=True)

class OrderDetailOut(BaseModel):
    id: int
    table_id: int
    user_id: int
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
