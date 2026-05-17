# websocket_manager.py
from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # "AAPL" -> {ws1, ws2}

    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = set()
        self.active_connections[symbol].add(websocket)

    def disconnect(self, websocket: WebSocket, symbol: str):
        self.active_connections[symbol].discard(websocket)
        if not self.active_connections[symbol]:
            del self.active_connections[symbol]

    async def broadcast(self, symbol: str, message: dict):
        if symbol in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, symbol)


manager = ConnectionManager()

