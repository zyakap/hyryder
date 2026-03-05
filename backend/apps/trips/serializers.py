"""Serializers for Trip creation and status updates."""
from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Trip, TripStatus, PaymentMethod


class TripCreateSerializer(serializers.ModelSerializer):
    pickup_lat = serializers.FloatField(write_only=True)
    pickup_lng = serializers.FloatField(write_only=True)
    dropoff_lat = serializers.FloatField(write_only=True)
    dropoff_lng = serializers.FloatField(write_only=True)

    class Meta:
        model = Trip
        fields = [
            "pickup_address", "pickup_lat", "pickup_lng",
            "dropoff_address", "dropoff_lat", "dropoff_lng",
            "payment_method", "promo_code",
        ]

    def create(self, validated_data):
        pickup_location = Point(
            validated_data.pop("pickup_lng"),
            validated_data.pop("pickup_lat"),
            srid=4326,
        )
        dropoff_location = Point(
            validated_data.pop("dropoff_lng"),
            validated_data.pop("dropoff_lat"),
            srid=4326,
        )
        passenger = self.context["request"].user
        return Trip.objects.create(
            passenger=passenger,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            **validated_data,
        )


class TripSerializer(serializers.ModelSerializer):
    passenger_name = serializers.CharField(source="passenger.get_full_name", read_only=True)
    driver_name = serializers.CharField(source="driver.get_full_name", read_only=True)
    driver_phone = serializers.CharField(source="driver.phone_number", read_only=True)
    pickup_lat = serializers.SerializerMethodField()
    pickup_lng = serializers.SerializerMethodField()
    dropoff_lat = serializers.SerializerMethodField()
    dropoff_lng = serializers.SerializerMethodField()
    fare_pgk = serializers.ReadOnlyField()

    class Meta:
        model = Trip
        fields = [
            "id", "passenger_name", "driver_name", "driver_phone",
            "status", "payment_method", "is_paid",
            "pickup_address", "pickup_lat", "pickup_lng",
            "dropoff_address", "dropoff_lat", "dropoff_lng",
            "estimated_fare_toea", "final_fare_toea", "fare_pgk",
            "surge_multiplier", "platform_fee_toea", "promo_discount_toea",
            "distance_km", "duration_seconds",
            "requested_at", "matched_at", "arrived_at", "started_at", "completed_at",
            "sos_triggered",
        ]
        read_only_fields = ["id", "status", "requested_at"]

    def get_pickup_lat(self, obj):
        return obj.pickup_location.y if obj.pickup_location else None

    def get_pickup_lng(self, obj):
        return obj.pickup_location.x if obj.pickup_location else None

    def get_dropoff_lat(self, obj):
        return obj.dropoff_location.y if obj.dropoff_location else None

    def get_dropoff_lng(self, obj):
        return obj.dropoff_location.x if obj.dropoff_location else None
