from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from ws_manager import kds_manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/kitchen")
async def kitchen_websocket(websocket: WebSocket, station_id: Optional[int] = Query(None)):
    await kds_manager.connect(websocket, station_id)
    try:
        while True:
            # Although the KDS primarily listends, we wait for text here to keep connection open
            data = await websocket.receive_text()
            # KDS could optionally send pings or state updates back
    except WebSocketDisconnect:
        kds_manager.disconnect(websocket, station_id)
