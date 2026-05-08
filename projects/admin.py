from django.contrib import admin
from .models import Project, ProjectMember

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_by', 'created_at']
    search_fields = ['name']

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'user', 'role', 'joined_at']
    list_filter = ['role']
