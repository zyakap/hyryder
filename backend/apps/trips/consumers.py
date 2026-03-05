"""WebSocket consumer — real-time trip state for passengers & drivers."""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async


class TripConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.trip_id = self.scope["url_route"]["kwargs"]["trip_id"]
        self.group_name = f"trip_{self.trip_id}"
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        pass  # clients receive only; they don't send to this channel

    async def trip_update(self, event):
        """Handle messages sent to the trip group."""
        await self.send_json(event["data"])
