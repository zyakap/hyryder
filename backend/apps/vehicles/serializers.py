from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "id", "category", "make", "model", "year", "color",
            "plate_number", "seats", "is_active", "is_verified", "photo", "created_at"
        ]
        read_only_fields = ["id", "is_verified", "created_at"]
