from django.urls import path
from . import views

urlpatterns = [
    path("", views.DriverVehicleListCreateView.as_view(), name="vehicle-list"),
    path("<int:pk>/", views.DriverVehicleDetailView.as_view(), name="vehicle-detail"),
]
