from rest_framework import serializers
from .models import Message, Attachment
from accounts.serializers import UserMinimalSerializer

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'project', 'sender', 'recipient', 'content', 
            'is_edited', 'is_deleted', 'attachments', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']
