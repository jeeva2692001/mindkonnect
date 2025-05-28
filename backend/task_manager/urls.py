from django.contrib import admin
from django.urls import path
from authentication.views import CheckEmailView, SendOTPView, VerifyOTPView, RegisterView, UserInfoView, RefreshTokenView, LogoutView, UpdateProfileView, UserActivityLogView
from rest_framework_simplejwt.views import TokenBlacklistView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/check-email/', CheckEmailView.as_view(), name='check-email'),
    path('api/auth/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/user-info/', UserInfoView.as_view(), name='user-info'),
    path('api/auth/update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('api/auth/activity-logs/', UserActivityLogView.as_view(), name='activity_logs'),
    path('api/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('api/auth/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
]