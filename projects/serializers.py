"""
Serializers for projects and project members.
"""

from rest_framework import serializers
from .models import Project, ProjectMember
from accounts.serializers import UserMinimalSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for project membership."""
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Full project serializer with members."""
    created_by = UserMinimalSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'created_by',
            'members', 'member_count', 'task_count', 'my_role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_task_count(self, obj):
        return obj.tasks.count() if hasattr(obj, 'tasks') else 0

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight project serializer for list views."""
    created_by = UserMinimalSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'created_by',
            'member_count', 'task_count', 'my_role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_task_count(self, obj):
        return obj.tasks.count() if hasattr(obj, 'tasks') else 0

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a project."""
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Project name is required.')
        return value.strip()

    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(created_by=user, **validated_data)
        # Creator becomes admin
        ProjectMember.objects.create(
            project=project,
            user=user,
            role=ProjectMember.ROLE_ADMIN
        )
        return project


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding a member to a project."""
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectMember.ROLE_CHOICES, default=ProjectMember.ROLE_MEMBER)

    def validate_email(self, value):
        return value.lower()


class UpdateMemberRoleSerializer(serializers.Serializer):
    """Serializer for updating a member's role."""
    role = serializers.ChoiceField(choices=ProjectMember.ROLE_CHOICES)
