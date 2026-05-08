"""
Custom permissions for project RBAC enforcement.
"""

from rest_framework import permissions
from .models import ProjectMember


class IsProjectAdmin(permissions.BasePermission):
    """Check if the user is an ADMIN of the project."""
    
    message = 'You must be a project admin to perform this action.'

    def has_permission(self, request, view):
        project_id = view.kwargs.get('pk') or view.kwargs.get('project_id')
        if not project_id:
            return True
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.ROLE_ADMIN
        ).exists()


class IsProjectMember(permissions.BasePermission):
    """Check if the user is a member of the project."""
    
    message = 'You must be a project member to access this resource.'

    def has_permission(self, request, view):
        project_id = view.kwargs.get('pk') or view.kwargs.get('project_id')
        if not project_id:
            return True
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user
        ).exists()


class IsProjectAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything; members can only read."""
    
    message = 'You must be a project admin to modify this resource.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            project_id = view.kwargs.get('pk') or view.kwargs.get('project_id')
            if project_id:
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
                ).exists()
            return True
        
        project_id = view.kwargs.get('pk') or view.kwargs.get('project_id')
        if not project_id:
            return True
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.ROLE_ADMIN
        ).exists()
