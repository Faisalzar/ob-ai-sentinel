from typing import List, Dict, Any
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections. We can store them by user_id or just a flat list for admins
        self.admin_connections: List[WebSocket] = []

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)
        logger.info("Admin connected to WebSocket. Total admins: %d", len(self.admin_connections))

    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
            logger.info("Admin disconnected from WebSocket. Total admins: %d", len(self.admin_connections))

    async def broadcast_to_admins(self, message: Dict[str, Any]):
        """
        Broadcast a JSON message to all connected admin WebSockets.
        """
        if not self.admin_connections:
            return

        json_message = json.dumps(message)
        dead_connections = []

        for connection in self.admin_connections:
            try:
                await connection.send_text(json_message)
            except Exception as e:
                logger.error("Error sending message to admin WebSocket: %s", e)
                dead_connections.append(connection)

        # Cleanup dead connections
        for dead in dead_connections:
            self.disconnect_admin(dead)

# Global instance to be used across the app
manager = ConnectionManager()
