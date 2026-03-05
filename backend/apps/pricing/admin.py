from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import FareConfig, PromoCode


@admin.register(FareConfig)
class FareConfigAdmin(ModelAdmin):
    list_display = ["category", "base_fare_toea", "per_km_toea", "per_minute_toea", "minimum_fare_toea", "is_active"]


@admin.register(PromoCode)
class PromoCodeAdmin(ModelAdmin):
    list_display = ["code", "discount_type", "discount_value", "usage_count", "usage_limit", "is_active", "valid_until"]
    list_filter = ["discount_type", "is_active"]
    search_fields = ["code"]
