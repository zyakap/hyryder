from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Payment, DriverPayout


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = ["id", "trip", "method", "amount_toea", "status", "created_at"]
    list_filter = ["method", "status"]
    search_fields = ["trip__id", "passenger__phone_number", "driver__phone_number"]


@admin.register(DriverPayout)
class DriverPayoutAdmin(ModelAdmin):
    list_display = ["id", "driver", "amount_toea", "method", "status", "created_at"]
    list_filter = ["method", "status"]
    search_fields = ["driver__phone_number", "reference"]
