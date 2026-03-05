from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notifications"),
    path("read-all/", views.mark_all_read, name="mark-all-read"),
]
