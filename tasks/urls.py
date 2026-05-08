"""URL patterns for tasks."""

from django.urls import path
from . import views

urlpatterns = [
    path('my-tasks/', views.my_tasks, name='my-tasks'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('project/<int:project_id>/', views.task_list_create, name='task-list-create'),
    path('project/<int:project_id>/<int:pk>/', views.task_detail, name='task-detail'),
    path('project/<int:project_id>/<int:pk>/status/', views.task_status_update, name='task-status-update'),
]
