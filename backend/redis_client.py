import redis.asyncio as redis
import os
import json

REDIS_URL = os.getenv("REDIS_URL")

# Real Redis client if URL is provided, otherwise Mock
if REDIS_URL:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
else:
    class MockRedis:
        def __init__(self):
            self.cache = {}

        async def get(self, key):
            return self.cache.get(key)

        async def setex(self, key, time, value):
            self.cache[key] = value

        async def delete(self, key):
            if key in self.cache:
                del self.cache[key]

        async def ping(self):
            return True

    redis_client = MockRedis()
async def get_menu_cache():
    try:
        data = await redis_client.get("rasoi360:menu")
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

async def set_menu_cache(menu_data: list, expire: int = 3600):
    try:
        await redis_client.setex("rasoi360:menu", expire, json.dumps(menu_data))
    except Exception as e:
        print(f"Redis set error: {e}")

async def invalidate_menu_cache():
    try:
        await redis_client.delete("rasoi360:menu")
    except Exception as e:
        print(f"Redis invalidate error: {e}")
