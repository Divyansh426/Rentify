from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Rentify API is running'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('rentals.urls')),
    path('api/health/', health_check),
]
