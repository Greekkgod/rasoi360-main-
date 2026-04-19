import asyncio
import bcrypt
import datetime
from database import engine, async_session_maker
from models import Base, Category, MenuItem, RestaurantTable, Role, User, Restaurant, KitchenStation

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def create_trial_restaurant(session, name, slug, admin_email, admin_phone):
    # 1. Create Restaurant
    trial_days = 14
    restaurant = Restaurant(
        name=name,
        slug=slug,
        subscription_status="trial",
        trial_ends_at=datetime.datetime.utcnow() + datetime.timedelta(days=trial_days)
    )
    session.add(restaurant)
    await session.flush()

    # 2. Get Roles
    from sqlalchemy import select
    res = await session.execute(select(Role).where(Role.name == "admin"))
    admin_role = res.scalar_one()
    res = await session.execute(select(Role).where(Role.name == "waiter"))
    waiter_role = res.scalar_one()
    res = await session.execute(select(Role).where(Role.name == "chef"))
    chef_role = res.scalar_one()

    # 3. Create Admin User for this restaurant
    admin_user = User(
        restaurant_id=restaurant.id,
        full_name=f"{name} Admin",
        email=admin_email,
        phone_number=admin_phone,
        password_hash=get_password_hash("password123"),
        role_id=admin_role.id
    )
    session.add(admin_user)

    # 4. Create Kitchen Stations
    pantry = KitchenStation(name="Pantry", restaurant_id=restaurant.id)
    main_kitchen = KitchenStation(name="Main Kitchen", restaurant_id=restaurant.id)
    session.add_all([pantry, main_kitchen])
    await session.flush()

    # 5. Add Sample Menu
    c_starters = Category(name="Starters", restaurant_id=restaurant.id)
    c_mains = Category(name="Main Course", restaurant_id=restaurant.id)
    session.add_all([c_starters, c_mains])
    await session.flush()

    session.add_all([
        MenuItem(name="Spring Rolls", price=180.0, category_id=c_starters.id, restaurant_id=restaurant.id, station_id=pantry.id),
        MenuItem(name="Veg Manchurian", price=220.0, category_id=c_starters.id, restaurant_id=restaurant.id, station_id=main_kitchen.id),
        MenuItem(name="Paneer Butter Masala", price=320.0, category_id=c_mains.id, restaurant_id=restaurant.id, station_id=main_kitchen.id),
    ])

    # 6. Add Tables
    session.add_all([
        RestaurantTable(table_number="T1", restaurant_id=restaurant.id),
        RestaurantTable(table_number="T2", restaurant_id=restaurant.id),
        RestaurantTable(table_number="T3", restaurant_id=restaurant.id),
    ])
    
    print(f"✅ Created trial restaurant: {name} (Slug: {slug})")
    print(f"📧 Admin: {admin_email} / password123")
    print(f"⏳ Trial ends in {trial_days} days.")

async def setup_base_system():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        # Global Roles
        admin_role = Role(name="admin")
        waiter_role = Role(name="waiter")
        chef_role = Role(name="chef")
        cashier_role = Role(name="cashier")
        session.add_all([admin_role, waiter_role, chef_role, cashier_role])
        await session.commit()
    print("🚀 Base system roles established.")

async def main():
    await setup_base_system()
    
    async with async_session_maker() as session:
        # 1. Create Platform Superuser (YOU)
        from sqlalchemy import select
        res = await session.execute(select(Role).where(Role.name == "admin"))
        admin_role = res.scalar_one()

        superuser = User(
            full_name="Rasoi360 Owner",
            email="owner@rasoi360.com",
            phone_number="0000000000",
            password_hash=get_password_hash("master123"),
            role_id=admin_role.id,
            is_superuser=True
        )
        session.add(superuser)
        
        # 2. Create trial restaurants
        await create_trial_restaurant(session, "The Gourmet Hub", "gourmet", "admin@gourmet.com", "9000000001")
        await create_trial_restaurant(session, "Spice Route", "spice", "admin@spice.com", "9000000002")
        await session.commit()
    
    print("\n✨ SaaS Trial Seed Completed!")
    print("🔑 Superuser: owner@rasoi360.com / master123")

if __name__ == "__main__":
    asyncio.run(main())
