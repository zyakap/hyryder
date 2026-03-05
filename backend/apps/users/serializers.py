"""Serializers for User, PassengerProfile, DriverProfile."""
from rest_framework import serializers
from .models import User, PassengerProfile, DriverProfile, UserRating


class PassengerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassengerProfile
        fields = ["home_address", "work_address", "promo_credits_toea"]
        read_only_fields = ["promo_credits_toea"]


class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = [
            "verification_status",
            "license_number", "license_expiry",
            "vehicle_registration", "registration_expiry",
            "wallet_balance_toea", "total_earnings_toea",
            "acceptance_rate", "completion_rate",
        ]
        read_only_fields = [
            "verification_status", "wallet_balance_toea",
            "total_earnings_toea", "acceptance_rate", "completion_rate",
        ]


class UserSerializer(serializers.ModelSerializer):
    passenger_profile = PassengerProfileSerializer(read_only=True)
    driver_profile = DriverProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "phone_number", "email", "first_name", "last_name",
            "full_name", "role", "is_phone_verified", "profile_photo",
            "rating", "total_trips", "preferred_language",
            "passenger_profile", "driver_profile",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "phone_number", "role", "is_phone_verified",
            "rating", "total_trips", "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserRatingSerializer(serializers.ModelSerializer):
    rated_by_name = serializers.CharField(source="rated_by.get_full_name", read_only=True)

    class Meta:
        model = UserRating
        fields = ["id", "trip", "rated_by_name", "score", "comment", "created_at"]
        read_only_fields = ["id", "rated_by_name", "created_at"]
