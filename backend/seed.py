import asyncio
import bcrypt
from database import engine, async_session_maker
from models import Base, Category, MenuItem, RestaurantTable, Role, User

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def seed():
    # create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        # Add roles
        admin_role = Role(name="admin")
        waiter_role = Role(name="waiter")
        chef_role = Role(name="chef")
        session.add_all([admin_role, waiter_role, chef_role])
        await session.flush()
        
        # Add users with emails
        admin_hash = get_password_hash("admin123")
        waiter_hash = get_password_hash("waiter123")
        chef_hash = get_password_hash("chef123")

        session.add(User(
            full_name="Admin",
            email="admin@rasoi360.com",
            phone_number="1234567890",
            password_hash=admin_hash,
            role_id=admin_role.id,
        ))
        session.add(User(
            full_name="Waiter 1",
            email="waiter@rasoi360.com",
            phone_number="9876543210",
            password_hash=waiter_hash,
            role_id=waiter_role.id,
        ))
        session.add(User(
            full_name="Chef Gordon",
            email="chef@rasoi360.com",
            phone_number="5555555555",
            password_hash=chef_hash,
            role_id=chef_role.id,
        ))
        
        # Add tables
        session.add_all([
            RestaurantTable(table_number="T1", status="Available"),
            RestaurantTable(table_number="T2", status="Occupied"),
            RestaurantTable(table_number="T3", status="Available")
        ])
        
        # Add Categories
        c_starters = Category(name="Starters")
        c_mains = Category(name="Main Course")
        c_drinks = Category(name="Beverages")
        session.add_all([c_starters, c_mains, c_drinks])
        await session.flush()
        
        # Add Menu Items
        session.add_all([
            MenuItem(name="Paneer Tikka", price=250.0, tax_slab=5.0, is_veg=True, category_id=c_starters.id),
            MenuItem(name="Chicken Kebab", price=320.0, tax_slab=12.0, is_veg=False, category_id=c_starters.id),
            MenuItem(name="Dal Makhani", price=280.0, tax_slab=5.0, is_veg=True, category_id=c_mains.id),
            MenuItem(name="Butter Chicken", price=450.0, tax_slab=12.0, is_veg=False, category_id=c_mains.id),
            MenuItem(name="Masala Chai", price=50.0, tax_slab=5.0, is_veg=True, category_id=c_drinks.id),
            MenuItem(name="Fresh Lime Soda", price=90.0, tax_slab=18.0, is_veg=True, category_id=c_drinks.id)
        ])
        
        await session.commit()
    print("Database seeded completely!")
    print("Users created:")
    print("  admin@rasoi360.com / admin123  (role: admin)")
    print("  waiter@rasoi360.com / waiter123 (role: waiter)")
    print("  chef@rasoi360.com / chef123     (role: chef)")

if __name__ == "__main__":
    asyncio.run(seed())
