"""
Root URL configuration for Team Task Manager.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'message': 'Team Task Manager API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'projects': '/api/projects/',
            'tasks': '/api/tasks/',
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root),
    path('api/auth/', include('accounts.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/tasks/', include('tasks.urls')),
]
