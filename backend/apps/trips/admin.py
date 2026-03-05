from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Trip


@admin.register(Trip)
class TripAdmin(ModelAdmin):
    list_display = ["id", "passenger", "driver", "status", "payment_method", "is_paid", "requested_at"]
    list_filter = ["status", "payment_method", "is_paid", "sos_triggered"]
    search_fields = ["passenger__phone_number", "driver__phone_number", "pickup_address", "dropoff_address"]
    readonly_fields = ["requested_at", "matched_at", "arrived_at", "started_at", "completed_at"]
    ordering = ["-requested_at"]
