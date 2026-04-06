from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    phone_number = Column(String(15), unique=True, index=True)
    password_hash = Column(String(255))
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="waiter")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    description = Column(String(255), nullable=True)
    
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=True)
    name = Column(String(100), index=True)
    price = Column(Float)
    cost_price = Column(Float, default=0.0)  # Cost to make the dish
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(255), nullable=True)
    
    category = relationship("Category", back_populates="menu_items")
    station = relationship("KitchenStation")

class KitchenStation(Base):
    __tablename__ = "kitchen_stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    kots = relationship("KOT", back_populates="station")

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), unique=True, index=True)
    status = Column(String(50), default="Available")
    
    orders = relationship("Order", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="draft")
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(50), default="dine_in")  # dine_in, zomato, swiggy
    external_order_id = Column(String(100), nullable=True)  # Zomato/Swiggy order ID
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(15), nullable=True)
    
    table = relationship("RestaurantTable", back_populates="orders")
    waiter = relationship("User", back_populates="orders")
    kots = relationship("KOT", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class KOT(Base):
    __tablename__ = "kots"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=True)
    status = Column(String(50), default="received")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    order = relationship("Order", back_populates="kots")
    station = relationship("KitchenStation", back_populates="kots")
    items = relationship("KOTItem", back_populates="kot")

class KOTItem(Base):
    __tablename__ = "kot_items"
    id = Column(Integer, primary_key=True, index=True)
    kot_id = Column(Integer, ForeignKey("kots.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer, default=1)
    special_instructions = Column(String(255), nullable=True)
    
    kot = relationship("KOT", back_populates="items")
    menu_item = relationship("MenuItem")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    method = Column(String(50))
    status = Column(String(50), default="Pending")
    
    order = relationship("Order", back_populates="payments")

# --- NEW: Inventory Management ---
class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    category = Column(String(50), default="General")  # Vegetables, Dairy, Spices, Meat, Grains, Others
    unit = Column(String(20), default="kg")  # kg, ltr, pcs, gm
    current_stock = Column(Float, default=0.0)
    min_stock = Column(Float, default=0.0)  # Alert threshold
    cost_per_unit = Column(Float, default=0.0)
    supplier = Column(String(100), nullable=True)
    last_restocked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    change_type = Column(String(20))  # restock, consumed, waste, adjustment
    quantity_change = Column(Float)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    item = relationship("InventoryItem")

# --- NEW: Aggregator Integration ---
class AggregatorConfig(Base):
    __tablename__ = "aggregator_configs"
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), unique=True)  # zomato, swiggy
    is_active = Column(Boolean, default=False)
    api_key = Column(String(255), nullable=True)
    restaurant_id = Column(String(100), nullable=True)
    commission_rate = Column(Float, default=0.0)  # e.g., 25%
    auto_accept = Column(Boolean, default=False)
    webhook_secret = Column(String(255), nullable=True)
