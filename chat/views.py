from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from projects.models import Project, ProjectMember
from .models import Message, Attachment
from .serializers import MessageSerializer

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def project_messages(request, project_id):
    """List or send messages in a project chat."""
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({'success': False, 'error': {'message': 'Project not found.'}}, status=404)

    # Check membership
    if not ProjectMember.objects.filter(project=project, user=request.user).exists():
        return Response({'success': False, 'error': {'message': 'Not a member.'}}, status=403)

    if request.method == 'GET':
        messages = Message.objects.filter(project=project).prefetch_related('attachments', 'sender')
        serializer = MessageSerializer(messages, many=True)
        return Response({'success': True, 'data': serializer.data})

    if request.method == 'POST':
        content = request.data.get('content', '')
        files = request.FILES.getlist('files')
        
        if not content and not files:
            return Response({'success': False, 'error': {'message': 'Empty message.'}}, status=400)

        message = Message.objects.create(
            project=project,
            sender=request.user,
            content=content
        )

        for f in files:
            Attachment.objects.create(
                message=message,
                file=f,
                file_name=f.name,
                file_type=f.content_type,
                file_size=f.size
            )

        return Response({'success': True, 'data': MessageSerializer(message).data}, status=201)

@csrf_exempt
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def edit_message(request, pk):
    """Edit or delete a message."""
    try:
        message = Message.objects.get(pk=pk, sender=request.user)
    except Message.DoesNotExist:
        return Response({'success': False, 'error': {'message': 'Message not found or not yours.'}}, status=404)

    if request.method == 'DELETE':
        message.is_deleted = True
        message.content = "This message was deleted."
        message.save()
        return Response({'success': True, 'message': 'Deleted.'})

    if request.method == 'PATCH':
        content = request.data.get('content')
        if content:
            message.content = content
            message.is_edited = True
            message.save()
        return Response({'success': True, 'data': MessageSerializer(message).data})
