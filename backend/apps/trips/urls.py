from django.urls import path
from . import views

urlpatterns = [
    path("request/", views.RequestTripView.as_view(), name="request-trip"),
    path("<int:trip_id>/", views.TripDetailView.as_view(), name="trip-detail"),
    path("<int:trip_id>/status/", views.update_trip_status, name="trip-status-update"),
    path("<int:trip_id>/cancel/", views.cancel_trip, name="trip-cancel"),
    path("<int:trip_id>/sos/", views.sos_trigger, name="trip-sos"),
    path("history/passenger/", views.PassengerTripHistoryView.as_view(), name="passenger-history"),
    path("history/driver/", views.DriverTripHistoryView.as_view(), name="driver-history"),
]
