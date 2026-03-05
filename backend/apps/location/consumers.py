"""WebSocket consumer — driver broadcasts GPS location every 3 seconds."""
import json
import structlog
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

logger = structlog.get_logger(__name__)


class DriverLocationConsumer(AsyncJsonWebsocketConsumer):
    """
    Driver connects here to broadcast their GPS position.
    Passenger trip consumers receive location updates via the trip group.
    """

    async def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated or not user.is_driver:
            await self.close()
            return
        self.driver_id = user.id
        self.group_name = f"driver_location_{self.driver_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.set_driver_online(True)
        logger.info("driver_connected", driver_id=self.driver_id)

    async def disconnect(self, close_code):
        await self.set_driver_online(False)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info("driver_disconnected", driver_id=self.driver_id)

    async def receive_json(self, content):
        """Receive {lat, lng, heading, speed_kmh} from driver device."""
        lat = content.get("lat")
        lng = content.get("lng")
        heading = content.get("heading", 0.0)
        speed = content.get("speed_kmh", 0.0)

        if lat is None or lng is None:
            return

        location = await self.update_location(lat, lng, heading, speed)
        trip_id = await self.get_active_trip_id()
        if trip_id:
            await self.channel_layer.group_send(
                f"trip_{trip_id}",
                {
                    "type": "trip.update",
                    "data": {
                        "event": "driver_location",
                        "lat": lat,
                        "lng": lng,
                        "heading": heading,
                        "speed_kmh": speed,
                    },
                },
            )

    @database_sync_to_async
    def set_driver_online(self, online: bool):
        from .models import DriverLocation
        from django.contrib.gis.geos import Point
        DriverLocation.objects.update_or_create(
            driver_id=self.driver_id,
            defaults={"is_online": online, "location": Point(0, 0, srid=4326)},
        )

    @database_sync_to_async
    def update_location(self, lat, lng, heading, speed):
        from .models import DriverLocation
        from django.contrib.gis.geos import Point
        DriverLocation.objects.update_or_create(
            driver_id=self.driver_id,
            defaults={
                "location": Point(lng, lat, srid=4326),
                "heading": heading,
                "speed_kmh": speed,
                "is_online": True,
            },
        )

    @database_sync_to_async
    def get_active_trip_id(self):
        from apps.trips.models import Trip, TripStatus
        trip = Trip.objects.filter(
            driver_id=self.driver_id,
            status__in=[TripStatus.DRIVER_MATCHED, TripStatus.DRIVER_ARRIVED, TripStatus.IN_PROGRESS],
        ).values_list("id", flat=True).first()
        return trip
