"""
Custom JWT authentication that reads tokens from httpOnly cookies.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that extracts the access token 
    from httpOnly cookies instead of the Authorization header.
    """

    def authenticate(self, request):
        # First try cookie
        raw_token = request.COOKIES.get('access_token')
        
        # Fall back to Authorization header
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
