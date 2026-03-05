from django.urls import path
from . import views

urlpatterns = [
    path("tickets/", views.TicketListCreateView.as_view(), name="ticket-list"),
    path("tickets/<int:pk>/", views.TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<int:ticket_id>/messages/", views.AddTicketMessageView.as_view(), name="ticket-message"),
]
