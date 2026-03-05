from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SupportTicket, TicketMessage


@admin.register(SupportTicket)
class SupportTicketAdmin(ModelAdmin):
    list_display = ["id", "user", "category", "subject", "status", "priority", "created_at"]
    list_filter = ["status", "category", "priority"]
    search_fields = ["user__phone_number", "subject"]
    ordering = ["priority", "-created_at"]
