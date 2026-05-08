"""
Project views with full RBAC enforcement.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from .models import Project, ProjectMember
from .serializers import (
    ProjectSerializer, ProjectListSerializer, ProjectCreateSerializer,
    ProjectMemberSerializer, AddMemberSerializer, UpdateMemberRoleSerializer
)
from accounts.models import User


class ProjectPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ─── Project CRUD ───

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_list_create(request):
    """List user's projects or create a new project."""
    if request.method == 'GET':
        projects = Project.objects.filter(
            members__user=request.user
        ).distinct().prefetch_related('members__user', 'tasks')
        
        search = request.query_params.get('search', '')
        if search:
            projects = projects.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        paginator = ProjectPagination()
        page = paginator.paginate_queryset(projects, request)
        serializer = ProjectListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    # POST - Create project
    serializer = ProjectCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    project = serializer.save()
    return Response(
        {
            'success': True,
            'message': 'Project created successfully.',
            'data': ProjectSerializer(project, context={'request': request}).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def project_detail(request, pk):
    """Get, update, or delete a project."""
    try:
        project = Project.objects.prefetch_related('members__user', 'tasks').get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Project not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check membership
    membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not membership:
        return Response(
            {'success': False, 'error': {'message': 'You are not a member of this project.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        serializer = ProjectSerializer(project, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    # PATCH / DELETE require admin
    if membership.role != ProjectMember.ROLE_ADMIN:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can modify the project.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PATCH':
        serializer = ProjectCreateSerializer(project, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        project.refresh_from_db()
        return Response({
            'success': True,
            'message': 'Project updated successfully.',
            'data': ProjectSerializer(project, context={'request': request}).data
        })

    # DELETE
    project.delete()
    return Response(
        {'success': True, 'message': 'Project deleted successfully.'},
        status=status.HTTP_200_OK
    )


# ─── Member Management ───

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_members(request, pk):
    """List or add project members."""
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Project not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not membership:
        return Response(
            {'success': False, 'error': {'message': 'You are not a member of this project.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        members = ProjectMember.objects.filter(project=project).select_related('user')
        serializer = ProjectMemberSerializer(members, many=True)
        return Response({'success': True, 'data': serializer.data})

    # POST - Add member (admin only)
    if membership.role != ProjectMember.ROLE_ADMIN:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can add members.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AddMemberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(email=serializer.validated_data['email'])
    except User.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'No user found with this email.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    if ProjectMember.objects.filter(project=project, user=user).exists():
        return Response(
            {'success': False, 'error': {'message': 'User is already a member of this project.'}},
            status=status.HTTP_409_CONFLICT
        )

    new_member = ProjectMember.objects.create(
        project=project,
        user=user,
        role=serializer.validated_data.get('role', ProjectMember.ROLE_MEMBER)
    )
    return Response(
        {
            'success': True,
            'message': f'{user.name} added to the project.',
            'data': ProjectMemberSerializer(new_member).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def project_member_detail(request, pk, member_id):
    """Update or remove a project member."""
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Project not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check requesting user is admin
    requesting_membership = ProjectMember.objects.filter(
        project=project, user=request.user, role=ProjectMember.ROLE_ADMIN
    ).first()
    if not requesting_membership:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can manage members.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        target_membership = ProjectMember.objects.select_related('user').get(
            pk=member_id, project=project
        )
    except ProjectMember.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Member not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'PATCH':
        # Update role
        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Prevent demoting the last admin
        if (target_membership.role == ProjectMember.ROLE_ADMIN and 
            serializer.validated_data['role'] == ProjectMember.ROLE_MEMBER):
            admin_count = ProjectMember.objects.filter(
                project=project, role=ProjectMember.ROLE_ADMIN
            ).count()
            if admin_count <= 1:
                return Response(
                    {'success': False, 'error': {'message': 'Cannot remove the last admin. Transfer ownership first.'}},
                    status=status.HTTP_400_BAD_REQUEST
                )

        target_membership.role = serializer.validated_data['role']
        target_membership.save()
        return Response({
            'success': True,
            'message': f'Role updated to {target_membership.role}.',
            'data': ProjectMemberSerializer(target_membership).data
        })

    # DELETE - Remove member
    if target_membership.user == request.user:
        # Admin leaving - check if last admin
        admin_count = ProjectMember.objects.filter(
            project=project, role=ProjectMember.ROLE_ADMIN
        ).count()
        if target_membership.role == ProjectMember.ROLE_ADMIN and admin_count <= 1:
            return Response(
                {'success': False, 'error': {'message': 'Cannot remove the last admin. Transfer ownership first.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

    target_membership.delete()
    return Response({
        'success': True,
        'message': 'Member removed from the project.'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transfer_ownership(request, pk):
    """Transfer project ownership to another admin."""
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Project not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only the creator or an admin can transfer
    membership = ProjectMember.objects.filter(
        project=project, user=request.user, role=ProjectMember.ROLE_ADMIN
    ).first()
    if not membership:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can transfer ownership.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            {'success': False, 'error': {'message': 'user_id is required.'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target_member = ProjectMember.objects.select_related('user').get(
            project=project, user_id=user_id
        )
    except ProjectMember.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Target user is not a member of this project.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    # Make target user admin and update created_by
    target_member.role = ProjectMember.ROLE_ADMIN
    target_member.save()
    project.created_by = target_member.user
    project.save()

    return Response({
        'success': True,
        'message': f'Ownership transferred to {target_member.user.name}.',
        'data': ProjectSerializer(project, context={'request': request}).data
    })
