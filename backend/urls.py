from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse


def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Rentify API is running'})


def home(request):
    return HttpResponse("Rentify Backend Running")


urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('rentals.urls')),
    path('api/health/', health_check),
]