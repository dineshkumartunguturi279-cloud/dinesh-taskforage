"""URL patterns for projects."""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.project_list_create, name='project-list-create'),
    path('<int:pk>/', views.project_detail, name='project-detail'),
    path('<int:pk>/members/', views.project_members, name='project-members'),
    path('<int:pk>/members/<int:member_id>/', views.project_member_detail, name='project-member-detail'),
    path('<int:pk>/transfer-ownership/', views.transfer_ownership, name='project-transfer-ownership'),
]
