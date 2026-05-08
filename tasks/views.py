"""
Task views with full RBAC enforcement.
Admins: full CRUD + assign.
Members: view tasks, update ONLY status of assigned tasks.
"""

from django.db.models import Q, Count
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Task, TaskAssignment
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskCreateSerializer,
    TaskUpdateSerializer, TaskStatusUpdateSerializer, TaskAssignmentSerializer
)
from projects.models import Project, ProjectMember
from accounts.models import User


class TaskPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _check_project_membership(user, project_id):
    """Check user membership and return (project, membership) or error response."""
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return None, None, Response(
            {'success': False, 'error': {'message': 'Project not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )
    
    membership = ProjectMember.objects.filter(project=project, user=user).first()
    if not membership:
        return project, None, Response(
            {'success': False, 'error': {'message': 'You are not a member of this project.'}},
            status=status.HTTP_403_FORBIDDEN
        )
    
    return project, membership, None


# ─── Task CRUD ───

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request, project_id):
    """List project tasks or create a new task."""
    project, membership, error = _check_project_membership(request.user, project_id)
    if error:
        return error

    if request.method == 'GET':
        tasks = Task.objects.filter(project=project).prefetch_related(
            'assignments__user', 'created_by'
        )
        
        # Members can only see their own tasks
        if membership.role == ProjectMember.ROLE_MEMBER:
            tasks = tasks.filter(assignments__user=request.user)
        
        # Filtering
        task_status = request.query_params.get('status')
        if task_status:
            tasks = tasks.filter(status=task_status)

        priority = request.query_params.get('priority')
        if priority:
            tasks = tasks.filter(priority=priority)

        search = request.query_params.get('search')
        if search:
            tasks = tasks.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        overdue = request.query_params.get('overdue')
        if overdue == 'true':
            tasks = tasks.filter(
                due_date__lt=timezone.now().date(),
                status__in=[Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
            )

        assigned_to = request.query_params.get('assigned_to')
        if assigned_to:
            tasks = tasks.filter(assignments__user_id=assigned_to)

        # Sorting
        sort_by = request.query_params.get('sort', '-created_at')
        valid_sorts = ['created_at', '-created_at', 'due_date', '-due_date', 'priority', '-priority', 'title', '-title']
        if sort_by in valid_sorts:
            tasks = tasks.order_by(sort_by)

        paginator = TaskPagination()
        page = paginator.paginate_queryset(tasks, request)
        serializer = TaskListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # POST - Create task (admin only)
    if membership.role != ProjectMember.ROLE_ADMIN:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can create tasks.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = TaskCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    assigned_to_ids = serializer.validated_data.pop('assigned_to', [])
    task = Task.objects.create(
        project=project,
        created_by=request.user,
        **serializer.validated_data
    )

    # Create assignments
    _assign_users(task, assigned_to_ids, request.user, project)

    return Response(
        {
            'success': True,
            'message': 'Task created successfully.',
            'data': TaskSerializer(task).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, project_id, pk):
    """Get, update, or delete a task."""
    project, membership, error = _check_project_membership(request.user, project_id)
    if error:
        return error

    try:
        task = Task.objects.prefetch_related('assignments__user', 'assignments__assigned_by').get(
            pk=pk, project=project
        )
    except Task.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Task not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        return Response({
            'success': True,
            'data': TaskSerializer(task).data
        })

    if request.method == 'PATCH':
        # Members can only update status of assigned tasks
        if membership.role == ProjectMember.ROLE_MEMBER:
            is_assigned = TaskAssignment.objects.filter(task=task, user=request.user).exists()
            if not is_assigned:
                return Response(
                    {'success': False, 'error': {'message': 'You can only update tasks assigned to you.'}},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Members can only update status
            status_serializer = TaskStatusUpdateSerializer(data=request.data)
            status_serializer.is_valid(raise_exception=True)
            task.status = status_serializer.validated_data['status']
            task.save()
            return Response({
                'success': True,
                'message': 'Task status updated.',
                'data': TaskSerializer(task).data
            })

        # Admin - full update
        serializer = TaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        assigned_to_ids = serializer.validated_data.pop('assigned_to', None)
        
        for field, value in serializer.validated_data.items():
            setattr(task, field, value)
        task.save()

        if task.status == Task.STATUS_DONE:
            _send_task_completion_email(task, request.user)

        if assigned_to_ids is not None:
            # Replace all assignments
            TaskAssignment.objects.filter(task=task).delete()
            _assign_users(task, assigned_to_ids, request.user, project)

        task.refresh_from_db()
        return Response({
            'success': True,
            'message': 'Task updated successfully.',
            'data': TaskSerializer(task).data
        })

    # DELETE (admin only)
    if membership.role != ProjectMember.ROLE_ADMIN:
        return Response(
            {'success': False, 'error': {'message': 'Only admins can delete tasks.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    task.delete()
    return Response({'success': True, 'message': 'Task deleted successfully.'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def task_status_update(request, project_id, pk):
    """Update only the status of a task (for members)."""
    project, membership, error = _check_project_membership(request.user, project_id)
    if error:
        return error

    try:
        task = Task.objects.get(pk=pk, project=project)
    except Task.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Task not found.'}},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user is assigned or is admin
    is_admin = membership.role == ProjectMember.ROLE_ADMIN
    is_assigned = TaskAssignment.objects.filter(task=task, user=request.user).exists()

    if not is_admin and not is_assigned:
        return Response(
            {'success': False, 'error': {'message': 'You can only update tasks assigned to you.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = TaskStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    task.status = serializer.validated_data['status']
    task.save()

    if task.status == Task.STATUS_DONE:
        _send_task_completion_email(task, request.user)

    return Response({
        'success': True,
        'message': 'Task status updated.',
        'data': TaskSerializer(task).data
    })


# ─── My Tasks ───

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tasks(request):
    """Get all tasks assigned to the current user across all projects."""
    tasks = Task.objects.filter(
        assignments__user=request.user
    ).prefetch_related('assignments__user', 'created_by').distinct()

    # Filtering
    task_status = request.query_params.get('status')
    if task_status:
        tasks = tasks.filter(status=task_status)

    priority = request.query_params.get('priority')
    if priority:
        tasks = tasks.filter(priority=priority)

    search = request.query_params.get('search')
    if search:
        tasks = tasks.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )

    overdue = request.query_params.get('overdue')
    if overdue == 'true':
        tasks = tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=[Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
        )

    sort_by = request.query_params.get('sort', '-created_at')
    valid_sorts = ['created_at', '-created_at', 'due_date', '-due_date', 'priority', '-priority']
    if sort_by in valid_sorts:
        tasks = tasks.order_by(sort_by)

    paginator = TaskPagination()
    page = paginator.paginate_queryset(tasks, request)
    serializer = TaskListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


# ─── Dashboard Analytics ───

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get dashboard analytics for the current user."""
    user = request.user
    today = timezone.now().date()

    # Get all projects user is member of
    user_projects = Project.objects.filter(members__user=user)
    
    # All tasks in user's projects
    all_tasks = Task.objects.filter(project__in=user_projects)
    
    # My assigned tasks
    my_assigned = Task.objects.filter(assignments__user=user)
    
    # Task counts by status
    status_counts = {}
    for s, label in Task.STATUS_CHOICES:
        status_counts[s] = all_tasks.filter(status=s).count()

    # Overdue tasks
    overdue_tasks = all_tasks.filter(
        due_date__lt=today,
        status__in=[Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
    )

    # Tasks per project
    tasks_per_project = []
    for project in user_projects[:10]:
        project_tasks = all_tasks.filter(project=project)
        tasks_per_project.append({
            'project_id': project.id,
            'project_name': project.name,
            'total': project_tasks.count(),
            'todo': project_tasks.filter(status=Task.STATUS_TODO).count(),
            'in_progress': project_tasks.filter(status=Task.STATUS_IN_PROGRESS).count(),
            'done': project_tasks.filter(status=Task.STATUS_DONE).count(),
        })

    # Recent tasks
    recent_tasks = TaskListSerializer(
        all_tasks.prefetch_related('assignments__user', 'created_by')[:10],
        many=True
    ).data

    # My task stats
    my_stats = {
        'total': my_assigned.count(),
        'todo': my_assigned.filter(status=Task.STATUS_TODO).count(),
        'in_progress': my_assigned.filter(status=Task.STATUS_IN_PROGRESS).count(),
        'done': my_assigned.filter(status=Task.STATUS_DONE).count(),
        'overdue': my_assigned.filter(
            due_date__lt=today,
            status__in=[Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
        ).count(),
    }

    # Priority distribution
    priority_counts = {}
    for p, label in Task.PRIORITY_CHOICES:
        priority_counts[p] = all_tasks.filter(priority=p).count()

    # Tasks per user — all members across user's projects
    tasks_per_user = []
    member_users = User.objects.filter(
        project_memberships__project__in=user_projects
    ).distinct()
    for member in member_users[:20]:
        assigned_count = TaskAssignment.objects.filter(
            user=member,
            task__project__in=user_projects
        ).count()
        if assigned_count > 0:
            tasks_per_user.append({
                'user_id': member.id,
                'user_name': member.name,
                'task_count': assigned_count,
            })
    tasks_per_user.sort(key=lambda x: x['task_count'], reverse=True)

    return Response({
        'success': True,
        'data': {
            'total_tasks': all_tasks.count(),
            'total_projects': user_projects.count(),
            'overdue_count': overdue_tasks.count(),
            'status_counts': status_counts,
            'priority_counts': priority_counts,
            'tasks_per_project': tasks_per_project,
            'tasks_per_user': tasks_per_user,
            'recent_tasks': recent_tasks,
            'my_stats': my_stats,
        }
    })


# ─── Helper Functions ───

def _assign_users(task, user_ids, assigned_by, project):
    """Assign users to a task. Users must be project members."""
    for user_id in user_ids:
        # Verify user is a project member
        is_member = ProjectMember.objects.filter(
            project=project, user_id=user_id
        ).exists()
        if is_member:
            TaskAssignment.objects.get_or_create(
                task=task,
                user_id=user_id,
                defaults={'assigned_by': assigned_by}
            )

def _send_task_completion_email(task, completed_by):
    """Send email notification to project admins when a task is completed."""
    admins = ProjectMember.objects.filter(
        project=task.project, 
        role=ProjectMember.ROLE_ADMIN
    ).select_related('user')
    
    admin_emails = [a.user.email for a in admins]
    
    if not admin_emails:
        return

    subject = f"Task Completed: {task.title}"
    message = f"""
Hello,

The following task has been marked as DONE in project '{task.project.name}':

Task: {task.title}
Completed by: {completed_by.name} ({completed_by.email})
Date: {timezone.now().strftime('%Y-%m-%d %H:%M')}

You can view the project here: {settings.FRONTEND_URL}/projects/{task.project.id}

Best regards,
TaskFlow System
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails,
            fail_silently=True,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
