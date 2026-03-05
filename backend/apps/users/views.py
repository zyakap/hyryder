"""Views for user profile management."""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import User, UserRating
from .serializers import UserSerializer, UserRatingSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's own profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserRatingsView(generics.ListAPIView):
    """List ratings received by a user."""
    serializer_class = UserRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id", self.request.user.id)
        return UserRating.objects.filter(rated_user_id=user_id).select_related("rated_by")


class SubmitRatingView(generics.CreateAPIView):
    """Submit a rating for the other party after a trip."""
    serializer_class = UserRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(rated_by=self.request.user)
