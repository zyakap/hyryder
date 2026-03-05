from rest_framework import serializers
from .models import DriverLocation


class NearbyDriverSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    driver_name = serializers.CharField(source="driver.get_full_name", read_only=True)
    driver_rating = serializers.DecimalField(source="driver.rating", max_digits=3, decimal_places=2, read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = DriverLocation
        fields = ["driver_id", "driver_name", "driver_rating", "lat", "lng", "heading", "distance_km"]

    def get_lat(self, obj):
        return obj.location.y

    def get_lng(self, obj):
        return obj.location.x

    def get_distance_km(self, obj):
        dist = getattr(obj, "distance", None)
        return round(dist.km, 2) if dist else None
