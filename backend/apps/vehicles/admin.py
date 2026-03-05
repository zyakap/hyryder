from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(ModelAdmin):
    list_display = ["plate_number", "driver", "category", "make", "model", "year", "is_active", "is_verified"]
    list_filter = ["category", "is_active", "is_verified"]
    search_fields = ["plate_number", "driver__phone_number", "make", "model"]
