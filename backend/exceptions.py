"""
Custom exception handler for consistent API error responses.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent JSON error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_response = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': _get_error_message(response),
                'details': response.data if isinstance(response.data, dict) else {'detail': response.data}
            }
        }
        response.data = custom_response
        return response

    # Handle unexpected exceptions
    return Response(
        {
            'success': False,
            'error': {
                'status_code': 500,
                'message': 'An unexpected error occurred.',
                'details': {}
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def _get_error_message(response):
    """Extract a human-readable message from the response."""
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            return str(response.data['detail'])
        # Get first error message
        for key, value in response.data.items():
            if isinstance(value, list) and value:
                return f"{key}: {value[0]}"
            elif isinstance(value, str):
                return f"{key}: {value}"
    elif isinstance(response.data, list) and response.data:
        return str(response.data[0])
    
    status_messages = {
        400: 'Bad request.',
        401: 'Authentication required.',
        403: 'Permission denied.',
        404: 'Resource not found.',
        405: 'Method not allowed.',
        409: 'Conflict.',
    }
    return status_messages.get(response.status_code, 'An error occurred.')
