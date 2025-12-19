from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create superuser Parthiv with password 1234'

    def handle(self, *args, **options):
        # Delete if exists
        User.objects.filter(username='Parthiv').delete()
        
        # Create superuser
        user = User.objects.create_superuser(
            username='Parthiv',
            email='parthiv@vestigo.com',
            password='1234'
        )
        user.first_name = 'Parthiv'
        user.last_name = ''
        user.save()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Superuser created successfully!\n'
                f'Username: Parthiv\n'
                f'Password: 1234\n'
                f'Email: parthiv@vestigo.com'
            )
        )
