from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Map of station_id -> list of WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Special key for 'all' or 'admin' connections
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, station_id: int = None):
        await websocket.accept()
        if station_id is None:
            self.global_connections.append(websocket)
        else:
            if station_id not in self.active_connections:
                self.active_connections[station_id] = []
            self.active_connections[station_id].append(websocket)

    def disconnect(self, websocket: WebSocket, station_id: int = None):
        if station_id is None:
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
        elif station_id in self.active_connections:
            if websocket in self.active_connections[station_id]:
                self.active_connections[station_id].remove(websocket)

    async def send_to_station(self, station_id: int, message: dict):
        # Send to specific station
        if station_id in self.active_connections:
            for connection in self.active_connections[station_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, station_id)
        
        # Also send to global/admin connections
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    async def broadcast_json(self, message: dict):
        # Send to everyone
        for station_id in self.active_connections:
            for connection in self.active_connections[station_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, station_id)
        
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

# Global manager instance
kds_manager = ConnectionManager()
