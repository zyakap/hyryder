"""Serializers for authentication flows."""
import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.users.models import User, UserRole


PNG_PHONE_RE = re.compile(r"^\+675[0-9]{7,8}$")


def validate_png_phone(value):
    if not PNG_PHONE_RE.match(value):
        raise serializers.ValidationError(
            "Enter a valid Papua New Guinea phone number, e.g. +6757123456"
        )
    return value


class SendOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.PASSENGER)

    def validate_phone_number(self, value):
        return validate_png_phone(value)


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate_phone_number(self, value):
        return validate_png_phone(value)


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["phone_number"] = user.phone_number
        token["is_phone_verified"] = user.is_phone_verified
        return token


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj["user"]).data
