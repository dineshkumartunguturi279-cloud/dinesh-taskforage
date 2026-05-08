"""
Serializers for authentication and user management.
"""

import re
from rest_framework import serializers
from .models import User


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password validation."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'confirm_password']
        read_only_fields = ['id']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('Password must contain at least one number.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate_email(self, value):
        return value.lower()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user serializer for embedding in other responses."""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email']
        read_only_fields = ['id', 'name', 'email']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('Password must contain at least one number.')
        return value
