from django.apps import AppConfig


class RentalsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rentals'

    def ready(self):
        # This connects all the signals when Django starts
        import rentals.signals  # noqa: F401
        # The above import is necessary to register the signal handlers.
