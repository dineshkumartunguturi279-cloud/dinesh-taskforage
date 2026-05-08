from django.urls import path
from . import views

urlpatterns = [
    path('project/<int:project_id>/', views.project_messages, name='project_messages'),
    path('message/<int:pk>/', views.edit_message, name='edit_message'),
]
