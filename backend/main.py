from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import menu, tables, orders, websockets, kots, stats, payments
from database import engine
from models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Rasoi360 POS API", lifespan=lifespan)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(tables.router)
app.include_router(orders.router)
app.include_router(kots.router)
app.include_router(stats.router)
app.include_router(payments.router)
app.include_router(websockets.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Rasoi360 API"}
