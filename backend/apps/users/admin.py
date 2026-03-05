from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User, PassengerProfile, DriverProfile, UserRating


@admin.register(User)
class UserAdmin(ModelAdmin, BaseUserAdmin):
    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email", "profile_photo")}),
        ("Role & Status", {"fields": ("role", "is_phone_verified", "is_active", "is_deleted")}),
        ("Stats", {"fields": ("rating", "total_trips")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("phone_number", "role", "password1", "password2")}),
    )
    list_display = ["phone_number", "first_name", "last_name", "role", "is_phone_verified", "rating", "is_active"]
    list_filter = ["role", "is_phone_verified", "is_active", "is_deleted"]
    search_fields = ["phone_number", "first_name", "last_name", "email"]
    ordering = ["-created_at"]


@admin.register(DriverProfile)
class DriverProfileAdmin(ModelAdmin):
    list_display = ["user", "verification_status", "license_number", "wallet_balance_toea"]
    list_filter = ["verification_status"]
    search_fields = ["user__phone_number", "license_number"]
