"""
Serializers for tasks and task assignments.
"""

from datetime import date
from rest_framework import serializers
from .models import Task, TaskAssignment
from accounts.serializers import UserMinimalSerializer
from projects.models import ProjectMember


class TaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for task assignments."""
    user = UserMinimalSerializer(read_only=True)
    assigned_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TaskAssignment
        fields = ['id', 'user', 'assigned_by', 'assigned_at']
        read_only_fields = ['id', 'assigned_by', 'assigned_at']


class TaskSerializer(serializers.ModelSerializer):
    """Full task serializer with assignments."""
    created_by = UserMinimalSerializer(read_only=True)
    assignments = TaskAssignmentSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'due_date', 'priority',
            'status', 'project', 'project_name', 'created_by',
            'assignments', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight task serializer for list views."""
    created_by = UserMinimalSerializer(read_only=True)
    assignee_count = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'due_date', 'priority', 'status',
            'project', 'project_name', 'created_by',
            'assignee_count', 'assignees', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_assignee_count(self, obj):
        return obj.assignments.count()

    def get_assignees(self, obj):
        return [
            {'id': a.user.id, 'name': a.user.name, 'email': a.user.email}
            for a in obj.assignments.select_related('user').all()[:5]
        ]


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a task."""
    assigned_to = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'due_date', 'priority', 'status', 'project', 'assigned_to']
        read_only_fields = ['id']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title is required.')
        return value.strip()

    def validate_due_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value

    def validate_priority(self, value):
        valid = [Task.PRIORITY_LOW, Task.PRIORITY_MEDIUM, Task.PRIORITY_HIGH, Task.PRIORITY_CRITICAL]
        if value not in valid:
            raise serializers.ValidationError(f'Invalid priority. Choose from: {", ".join(valid)}')
        return value

    def validate_status(self, value):
        valid = [Task.STATUS_TODO, Task.STATUS_IN_PROGRESS, Task.STATUS_DONE]
        if value not in valid:
            raise serializers.ValidationError(f'Invalid status. Choose from: {", ".join(valid)}')
        return value


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a task."""
    assigned_to = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )

    class Meta:
        model = Task
        fields = ['title', 'description', 'due_date', 'priority', 'status', 'assigned_to']

    def validate_title(self, value):
        if value is not None and not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value.strip() if value else value

    def validate_due_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value


class TaskStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating only task status (for members)."""
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
