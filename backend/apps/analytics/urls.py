from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.dashboard_summary, name="dashboard-summary"),
    path("revenue/", views.revenue_summary, name="revenue-summary"),
]
