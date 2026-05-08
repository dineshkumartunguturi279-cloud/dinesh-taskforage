"""
Task and TaskAssignment models.
"""

from django.db import models
from django.conf import settings


class Task(models.Model):
    """Task model with priority and status tracking."""
    
    # Priority choices
    PRIORITY_LOW = 'LOW'
    PRIORITY_MEDIUM = 'MEDIUM'
    PRIORITY_HIGH = 'HIGH'
    PRIORITY_CRITICAL = 'CRITICAL'
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    # Status choices
    STATUS_TODO = 'TODO'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_DONE = 'DONE'
    STATUS_CHOICES = [
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_DONE, 'Done'),
    ]

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default='')
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_TODO)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        """Check if the task is overdue."""
        from django.utils import timezone
        if self.due_date and self.status != self.STATUS_DONE:
            return self.due_date < timezone.now().date()
        return False


class TaskAssignment(models.Model):
    """Task assignment - one task can have multiple assigned users."""
    
    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_assignments'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assignments_made'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_assignments'
        unique_together = ['task', 'user']
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.user.name} assigned to {self.task.title}"
