"""
Project and ProjectMember models.
"""

from django.db import models
from django.conf import settings


class Project(models.Model):
    """Project model."""
    
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Project membership with role-based access."""
    
    ROLE_ADMIN = 'ADMIN'
    ROLE_MEMBER = 'MEMBER'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MEMBER, 'Member'),
    ]

    id = models.BigAutoField(primary_key=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ['project', 'user']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.name} - {self.project.name} ({self.role})"
