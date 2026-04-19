from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    slug = Column(String(100), unique=True, index=True) # for subdomains like bobs.rasoi360.com
    address = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    subscription_status = Column(String(50), default="trial") # trial, active, expired
    trial_ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="restaurant")
    categories = relationship("Category", back_populates="restaurant")
    tables = relationship("RestaurantTable", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")
    stations = relationship("KitchenStation", back_populates="restaurant")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True, nullable=True)
    phone_number = Column(String(15), unique=True, index=True)
    password_hash = Column(String(255))
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_superuser = Column(Boolean, default=False)
    
    restaurant = relationship("Restaurant", back_populates="users")
    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="waiter")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String(100), index=True)
    description = Column(String(255), nullable=True)
    
    restaurant = relationship("Restaurant", back_populates="categories")
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=True)
    name = Column(String(100), index=True)
    price = Column(Float)
    cost_price = Column(Float, default=0.0)
    tax_slab = Column(Float, default=5.0)
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(255), nullable=True)
    
    category = relationship("Category", back_populates="menu_items")
    station = relationship("KitchenStation")

class KitchenStation(Base):
    __tablename__ = "kitchen_stations"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String(100), index=True)
    is_active = Column(Boolean, default=True)
    
    restaurant = relationship("Restaurant", back_populates="stations")
    kots = relationship("KOT", back_populates="station")

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    table_number = Column(String(20), index=True)
    status = Column(String(50), default="Available")
    
    restaurant = relationship("Restaurant", back_populates="tables")
    orders = relationship("Order", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="draft")
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    discount_type = Column(String(50), nullable=True)
    final_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(50), default="dine_in")
    external_order_id = Column(String(100), nullable=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(15), nullable=True)
    payment_mode = Column(String(50), default="counter") # counter, upi, cash, etc.
    
    restaurant = relationship("Restaurant", back_populates="orders")
    table = relationship("RestaurantTable", back_populates="orders")
    waiter = relationship("User", back_populates="orders")
    kots = relationship("KOT", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class KOT(Base):
    __tablename__ = "kots"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
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
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    method = Column(String(50))
    status = Column(String(50), default="Pending")
    
    order = relationship("Order", back_populates="payments")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    invoice_number = Column(String(50), unique=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    gstin = Column(String(50), nullable=True)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    discount_applied = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    order = relationship("Order")

# --- NEW: Inventory Management ---
class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String(100), index=True)
    category = Column(String(50), default="General")
    unit = Column(String(20), default="kg")
    current_stock = Column(Float, default=0.0)
    min_stock = Column(Float, default=0.0)
    cost_per_unit = Column(Float, default=0.0)
    supplier = Column(String(100), nullable=True)
    last_restocked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    change_type = Column(String(20))
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
