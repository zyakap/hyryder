from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import OTPVerification


@admin.register(OTPVerification)
class OTPVerificationAdmin(ModelAdmin):
    list_display = ["phone_number", "is_verified", "attempts", "created_at", "expires_at"]
    list_filter = ["is_verified"]
    search_fields = ["phone_number"]
    readonly_fields = ["created_at", "expires_at"]
