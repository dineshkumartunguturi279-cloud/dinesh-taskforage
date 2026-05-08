import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User

def create_admin():
    email = 'admin@gmail.com'
    password = 'admin@123'
    
    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(
            email=email,
            password=password,
            name='Super Admin'
        )
        print(f"DONE: Superuser created: {email}")
    else:
        print(f"INFO: Superuser {email} already exists.")

if __name__ == "__main__":
    create_admin()
