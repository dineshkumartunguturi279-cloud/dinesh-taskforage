"""URL patterns for authentication."""

from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='auth-signup'),
    path('login/', views.login, name='auth-login'),
    path('logout/', views.logout, name='auth-logout'),
    path('refresh/', views.refresh_token, name='auth-refresh'),
    path('profile/', views.profile, name='auth-profile'),
    path('users/', views.user_list, name='user-list'),
    path('change-password/', views.change_password, name='auth-change-password'),
]
