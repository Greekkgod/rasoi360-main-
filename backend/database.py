import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Fallback to local SQLite for native testing without Docker
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./rasoi360.db"
)

# SQLite cannot use complex pool configurations like max_overflow natively.
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    echo=False
)

async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with async_session_maker() as session:
        yield session
