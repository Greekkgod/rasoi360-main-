from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
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
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=True) # Recommended station
    name = Column(String(100), index=True)
    price = Column(Float)
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(255), nullable=True)
    
    category = relationship("Category", back_populates="menu_items")
    station = relationship("KitchenStation")

class KitchenStation(Base):
    __tablename__ = "kitchen_stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True) # e.g., Grill, Fryer, Bar
    is_active = Column(Boolean, default=True)
    
    kots = relationship("KOT", back_populates="station")

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), unique=True, index=True)
    status = Column(String(50), default="Available") # Available, Occupied, Reserved
    
    orders = relationship("Order", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Waiter
    status = Column(String(50), default="draft") # draft, kitchen, served, paid
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    
    table = relationship("RestaurantTable", back_populates="orders")
    waiter = relationship("User", back_populates="orders")
    kots = relationship("KOT", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class KOT(Base):
    __tablename__ = "kots"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=True) # Where this ticket is being prepared
    status = Column(String(50), default="received") # received, preparing, ready
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
    method = Column(String(50)) # Cash, UPI, Card
    status = Column(String(50), default="Pending") # Pending, Completed
    
    order = relationship("Order", back_populates="payments")
