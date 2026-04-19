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
async def get_menu_cache(restaurant_id: int):
    try:
        data = await redis_client.get(f"rasoi360:menu:{restaurant_id}")
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

async def set_menu_cache(restaurant_id: int, menu_data: list, expire: int = 3600):
    try:
        await redis_client.setex(f"rasoi360:menu:{restaurant_id}", expire, json.dumps(menu_data))
    except Exception as e:
        print(f"Redis set error: {e}")

async def invalidate_menu_cache(restaurant_id: int):
    try:
        await redis_client.delete(f"rasoi360:menu:{restaurant_id}")
    except Exception as e:
        print(f"Redis invalidate error: {e}")
