from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("otp/send/", views.send_otp_view, name="send-otp"),
    path("otp/verify/", views.verify_otp_view, name="verify-otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.logout_view, name="logout"),
]
