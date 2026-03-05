from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import DailySnapshot


@admin.register(DailySnapshot)
class DailySnapshotAdmin(ModelAdmin):
    list_display = ["date", "total_trips", "completed_trips", "total_revenue_toea", "active_drivers"]
    readonly_fields = [f.name for f in DailySnapshot._meta.fields]
