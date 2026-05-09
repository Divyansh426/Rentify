from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/',    TokenObtainPairView.as_view()),
    path('auth/refresh/',  TokenRefreshView.as_view()),
    path('auth/me/',       views.CurrentUserView.as_view()),

    # ── Tenants  (order matters — named paths before <int:pk>) ───────────────
    path('tenants/',              views.TenantListView.as_view()),
    path('tenants/me/',           views.TenantSelfView.as_view()),
    path('tenants/search/',       views.SearchTenantView.as_view()),
    path('tenants/assign/',       views.AssignTenantView.as_view()),
    path('tenants/<int:pk>/',     views.TenantDetailView.as_view()),
    path('tenants/<int:pk>/remove/', views.RemoveTenantView.as_view()),

    # ── Rent ──────────────────────────────────────────────────────────────────
    path('rent/',          views.CreateRentPaymentView.as_view()),
    path('rent/<int:pk>/', views.UpdateRentStatusView.as_view()),

    # ── Properties & Rooms ────────────────────────────────────────────────────
    path('properties/',              views.PropertyListCreateView.as_view()),
    path('properties/<int:pk>/',     views.PropertyDetailView.as_view()),
    path('properties/<int:property_id>/rooms/', views.RoomCreateView.as_view()),
    path('rooms/',                   views.RoomListView.as_view()),

    # ── Notifications ─────────────────────────────────────────────────────────
    path('notifications/',           views.NotificationListView.as_view()),
    path('notifications/read-all/',  views.MarkAllNotificationsReadView.as_view()),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view()),

    # ── Analytics ─────────────────────────────────────────────────────────────
    path('analytics/',               views.LandlordAnalyticsView.as_view()),
]

