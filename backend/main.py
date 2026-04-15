from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import menu, tables, orders, websockets, kots, stats, payments, auth, invoices
from database import engine
from models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

import uuid
import logging
from sqlalchemy import text
from fastapi import Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from redis_client import redis_client

# Setup standard logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Rasoi360 POS API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred.", "code": "INTERNAL_ERROR"},
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    logger.info(f"request_id: {request_id} | endpoint: {request.method} {request.url.path} | status: pending")
    try:
        response = await call_next(request)
        logger.info(f"request_id: {request_id} | endpoint: {request.method} {request.url.path} | status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"request_id: {request_id} | endpoint: {request.method} {request.url.path} | error: {str(e)}")
        raise e

@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    db_status = "disconnected"
    redis_status = "disconnected"
    
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        pass
        
    try:
        if await redis_client.ping():
            redis_status = "connected"
    except Exception:
        pass
        
    return {
        "status": "ok" if db_status == "connected" and redis_status == "connected" else "degraded",
        "database": db_status,
        "redis": redis_status
    }

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
app.include_router(auth.router)
app.include_router(invoices.router)
@app.get("/")
async def root():
    return {"message": "Welcome to Rasoi360 API"}
