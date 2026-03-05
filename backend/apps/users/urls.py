from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.MeView.as_view(), name="user-me"),
    path("ratings/", views.UserRatingsView.as_view(), name="my-ratings"),
    path("<int:user_id>/ratings/", views.UserRatingsView.as_view(), name="user-ratings"),
    path("ratings/submit/", views.SubmitRatingView.as_view(), name="submit-rating"),
]
