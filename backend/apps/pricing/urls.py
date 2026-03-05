from django.urls import path
from . import views

urlpatterns = [
    path("estimate/", views.estimate_fare, name="fare-estimate"),
    path("configs/", views.fare_configs, name="fare-configs"),
]
