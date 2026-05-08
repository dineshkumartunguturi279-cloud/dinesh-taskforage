"""
Authentication views: signup, login, logout, refresh, profile.
All token handling uses httpOnly cookies.
"""

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    SignupSerializer, LoginSerializer, UserSerializer, ChangePasswordSerializer
)
from .models import User


def _get_cookie_settings():
    """Get cookie settings based on environment."""
    is_production = not settings.DEBUG
    return {
        'httponly': True,
        'secure': is_production,
        'samesite': 'None' if is_production else 'Lax',
        'path': '/',
    }


def _set_auth_cookies(response, user):
    """Set access and refresh token cookies on the response."""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    cookie_settings = _get_cookie_settings()

    response.set_cookie(
        'access_token',
        access_token,
        max_age=30 * 60,  # 30 minutes
        **cookie_settings
    )
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=7 * 24 * 60 * 60,  # 7 days
        **cookie_settings
    )
    return response


def _clear_auth_cookies(response):
    """Clear auth cookies from the response."""
    cookie_settings = _get_cookie_settings()
    response.delete_cookie('access_token', path='/', samesite=cookie_settings['samesite'])
    response.delete_cookie('refresh_token', path='/', samesite=cookie_settings['samesite'])
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """Register a new user account."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    response = Response(
        {
            'success': True,
            'message': 'Account created successfully.',
            'data': UserSerializer(user).data
        },
        status=status.HTTP_201_CREATED
    )
    return _set_auth_cookies(response, user)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate user and set JWT cookies."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'success': False, 'error': {'message': 'Invalid email or password.'}},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'success': False, 'error': {'message': 'Invalid email or password.'}},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'success': False, 'error': {'message': 'Account is disabled.'}},
            status=status.HTTP_403_FORBIDDEN
        )

    response = Response(
        {
            'success': True,
            'message': 'Login successful.',
            'data': UserSerializer(user).data
        },
        status=status.HTTP_200_OK
    )
    return _set_auth_cookies(response, user)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh the access token using the refresh token cookie."""
    refresh_token_str = request.COOKIES.get('refresh_token')
    
    if not refresh_token_str:
        return Response(
            {'success': False, 'error': {'message': 'No refresh token provided.'}},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        refresh = RefreshToken(refresh_token_str)
        user = User.objects.get(id=refresh['user_id'])
        
        # Rotate refresh token
        new_refresh = RefreshToken.for_user(user)
        access_token = str(new_refresh.access_token)
        
        cookie_settings = _get_cookie_settings()
        
        response = Response(
            {
                'success': True,
                'message': 'Token refreshed successfully.',
                'data': UserSerializer(user).data
            },
            status=status.HTTP_200_OK
        )
        
        response.set_cookie(
            'access_token',
            access_token,
            max_age=30 * 60,
            **cookie_settings
        )
        response.set_cookie(
            'refresh_token',
            str(new_refresh),
            max_age=7 * 24 * 60 * 60,
            **cookie_settings
        )
        return response

    except (TokenError, User.DoesNotExist):
        response = Response(
            {'success': False, 'error': {'message': 'Invalid or expired refresh token.'}},
            status=status.HTTP_401_UNAUTHORIZED
        )
        return _clear_auth_cookies(response)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Log out the user by clearing auth cookies."""
    response = Response(
        {'success': True, 'message': 'Logged out successfully.'},
        status=status.HTTP_200_OK
    )
    return _clear_auth_cookies(response)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get or update the authenticated user's profile."""
    if request.method == 'GET':
        return Response({
            'success': True,
            'data': UserSerializer(request.user).data
        })

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({
        'success': True,
        'message': 'Profile updated successfully.',
        'data': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change the authenticated user's password."""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if not request.user.check_password(serializer.validated_data['current_password']):
        return Response(
            {'success': False, 'error': {'message': 'Current password is incorrect.'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()

    # Re-set cookies with new tokens
    response = Response({
        'success': True,
        'message': 'Password changed successfully.'
    })
    return _set_auth_cookies(response, request.user)
