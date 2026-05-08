from django.contrib import admin
from .models import Task, TaskAssignment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project', 'status', 'priority', 'due_date', 'created_by']
    list_filter = ['status', 'priority']
    search_fields = ['title']

@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'user', 'assigned_by', 'assigned_at']
