from django.urls import path
from . import views

urlpatterns = [
    path("nearby-drivers/", views.nearby_drivers, name="nearby-drivers"),
    path("surge-zones/", views.surge_zones, name="surge-zones"),
]
