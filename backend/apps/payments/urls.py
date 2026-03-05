from django.urls import path
from . import views

urlpatterns = [
    path("intent/", views.create_payment_intent, name="create-payment-intent"),
    path("cash/confirm/", views.confirm_cash_payment, name="confirm-cash-payment"),
    path("payout/request/", views.request_payout, name="request-payout"),
    path("wallet/", views.driver_wallet, name="driver-wallet"),
]
