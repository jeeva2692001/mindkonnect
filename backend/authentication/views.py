import os
import secrets
import string
import requests
import logging
from datetime import datetime

from django.core.cache import cache
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from django_ratelimit.decorators import ratelimit
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import CustomUser, UserActivityLog
from .serializers import UserSerializer, RegisterSerializer, UserActivityLogSerializer

   # Setup Logging
logger = logging.getLogger(__name__)

   # Utility Functions
def generate_otp():
       """Generate a cryptographically secure 6-digit OTP."""
       return ''.join(secrets.choice(string.digits) for _ in range(6))

def send_otp_email(email, otp, purpose="verify your email"):
       """Send OTP email via Mailgun with improved error handling."""
       mailgun_api_key = os.getenv('MAILGUN_API_KEY')
       mailgun_domain = os.getenv('MAILGUN_DOMAIN')

       if not mailgun_api_key or not mailgun_domain:
           logger.error("Mailgun API key or domain not configured.")
           return False

       html_content = f"""
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #2A416F;">🔐 Your MindKonnect OTP</h2>
           <p style="color: #7182B8;">
               Use the code below to {purpose}. This OTP expires in 5 minutes.
           </p>
           <div style="background-color: #F1F0FB; padding: 15px; text-align: center; border-radius: 10px;">
               <h3 style="color: #9B87F5; font-size: 24px; margin: 0;">{otp}</h3>
           </div>
           <p style="color: #7182B8; margin-top: 20px;">
               If you didn't request this, please ignore this email.
           </p>
           <p style="color: #7182B8; font-size: 12px; margin-top: 30px;">
               © {datetime.now().year} MindKonnect. All rights reserved.
           </p>
       </div>
       """

       try:
           response = requests.post(
               f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
               auth=("api", mailgun_api_key),
               data={
                   "from": f"MindKonnect <no-reply@{mailgun_domain}>",
                   "to": email,
                   "subject": "Your OTP for MindKonnect",
                   "html": html_content,
               },
               timeout=10
           )
           response.raise_for_status()
           logger.info(f"OTP email sent to {email} successfully for {purpose}.")
           return True
       except requests.exceptions.RequestException as e:
           logger.error(f"Failed to send OTP email to {email}: {str(e)}")
           return False

def get_client_ip(request):
       """Extract the client's IP address from the request."""
       x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
       if x_forwarded_for:
           ip = x_forwarded_for.split(',')[0]
       else:
           ip = request.META.get('REMOTE_ADDR')
       return ip

   # API Views
class CheckEmailView(APIView):
       permission_classes = [AllowAny]

       @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
       def post(self, request):
           email = request.data.get('email')
           if not email:
               logger.warning("CheckEmailView: Email not provided in request.")
               return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

           try:
               EmailValidator()(email)
           except ValidationError:
               logger.warning(f"CheckEmailView: Invalid email format - {email}")
               return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

           user_exists = CustomUser.objects.filter(email=email).exists()
           logger.info(f"CheckEmailView: Email {email} exists: {user_exists}")
           return Response({'exists': user_exists}, status=status.HTTP_200_OK)

class SendOTPView(APIView):
       permission_classes = [AllowAny]

       @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
       def post(self, request):
           email = request.data.get('email')
           if not email:
               logger.warning("SendOTPView: Email not provided in request.")
               return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

           try:
               EmailValidator()(email)
           except ValidationError:
               logger.warning(f"SendOTPView: Invalid email format - {email}")
               return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

           user = CustomUser.objects.filter(email=email).first()
           ip_address = get_client_ip(request)

           otp = generate_otp()
           cache.set(f"otp_{email}", otp, timeout=300)  # 5 minutes
           logger.info(f"SendOTPView: Generated OTP for {email}: {otp}")

           # Log the OTP request
           if user:
               UserActivityLog.objects.create(
                   user=user,
                   action="otp_request",
                   ip_address=ip_address,
                   details="OTP requested for login"
               )

           if send_otp_email(email, otp):
               return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
           else:
               return Response({'error': 'Failed to send OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
       permission_classes = [AllowAny]

       @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
       def post(self, request):
           email = request.data.get('email')
           otp = request.data.get('otp')
           ip_address = get_client_ip(request)

           if not email or not otp:
               logger.warning("VerifyOTPView: Email or OTP not provided in request.")
               return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

           try:
               EmailValidator()(email)
           except ValidationError:
               logger.warning(f"VerifyOTPView: Invalid email format - {email}")
               return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

           stored_otp = cache.get(f"otp_{email}")
           user = CustomUser.objects.filter(email=email).first()

           if not stored_otp:
               if user:
                   UserActivityLog.objects.create(
                       user=user,
                       action="otp_failed",
                       ip_address=ip_address,
                       details="OTP expired or invalid"
                   )
               logger.warning(f"VerifyOTPView: OTP expired or invalid for {email}")
               return Response({'error': 'OTP expired or invalid'}, status=status.HTTP_400_BAD_REQUEST)

           if stored_otp != otp:
               if user:
                   UserActivityLog.objects.create(
                       user=user,
                       action="otp_failed",
                       ip_address=ip_address,
                       details="Invalid OTP"
                   )
               logger.warning(f"VerifyOTPView: Invalid OTP for {email}")
               return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

           cache.delete(f"otp_{email}")
           if user:
               refresh = RefreshToken.for_user(user)
               UserActivityLog.objects.create(
                   user=user,
                   action="login_success",
                   ip_address=ip_address,
                   details="User logged in successfully"
               )
               logger.info(f"VerifyOTPView: OTP verified for existing user {email}")
               return Response({
                   'refresh': str(refresh),
                   'access': str(refresh.access_token),
                   'exists': True
               }, status=status.HTTP_200_OK)
           
           logger.info(f"VerifyOTPView: OTP verified, user {email} does not exist")
           return Response({'exists': False}, status=status.HTTP_200_OK)

class RegisterView(APIView):
       permission_classes = [AllowAny]

       @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
       def post(self, request):
           serializer = RegisterSerializer(data=request.data)
           if serializer.is_valid():
               user = CustomUser.objects.create_user(
                   email=serializer.validated_data['email'],
                   first_name=serializer.validated_data['first_name'],
                   last_name=serializer.validated_data['last_name'],
                   mobile_number=serializer.validated_data['mobile_number'],
                   date_of_birth=serializer.validated_data['date_of_birth'],
                   nhs_number=serializer.validated_data.get('nhs_number', ''),
                   nhs_consent=serializer.validated_data.get('nhs_consent', False)
               )
               refresh = RefreshToken.for_user(user)
               ip_address = get_client_ip(request)
               UserActivityLog.objects.create(
                   user=user,
                   action="register_success",
                   ip_address=ip_address,
                   details="User registered successfully"
               )
               logger.info(f"RegisterView: User {user.email} registered successfully")
               return Response({
                   'refresh': str(refresh),
                   'access': str(refresh.access_token),
               }, status=status.HTTP_201_CREATED)
           logger.warning(f"RegisterView: Registration failed - {serializer.errors}")
           return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserInfoView(APIView):
       permission_classes = [IsAuthenticated]

       def get(self, request):
           user = request.user
           serializer = UserSerializer(user)
           logger.info(f"UserInfoView: Fetched info for user {user.email}")
           return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateProfileView(APIView):
       permission_classes = [IsAuthenticated]

       @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
       def post(self, request):
           user = request.user
           serializer = UserSerializer(user, data=request.data, partial=True)
           if serializer.is_valid():
               serializer.save()
               ip_address = get_client_ip(request)
               UserActivityLog.objects.create(
                   user=user,
                   action="profile_update",
                   ip_address=ip_address,
                   details="User updated profile"
               )
               logger.info(f"UpdateProfileView: User {user.email} updated profile successfully")
               return Response({
                   'message': 'Profile updated successfully',
                   'user': serializer.data
               }, status=status.HTTP_200_OK)
           logger.warning(f"UpdateProfileView: Profile update failed for {user.email} - {serializer.errors}")
           return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserActivityLogView(APIView):
       permission_classes = [IsAuthenticated]

       def get(self, request):
           user = request.user
           logs = user.activity_logs.all().order_by('-timestamp')[:50]  # Get the 50 most recent logs
           serializer = UserActivityLogSerializer(logs, many=True)
           logger.info(f"UserActivityLogView: Fetched activity logs for user {user.email}")
           return Response(serializer.data, status=status.HTTP_200_OK)

class RefreshTokenView(TokenRefreshView):
       permission_classes = [AllowAny]

       @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
       def post(self, request, *args, **kwargs):
           try:
               response = super().post(request, *args, **kwargs)
               logger.info("RefreshTokenView: Token refreshed successfully")
               return response
           except Exception as e:
               logger.error(f"RefreshTokenView: Token refresh failed - {str(e)}")
               return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
       permission_classes = [IsAuthenticated]

       @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
       def post(self, request):
           try:
               refresh_token = request.data.get("refresh")
               if not refresh_token:
                   logger.warning(f"LogoutView: Refresh token not provided for user {request.user.email}")
                   return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

               token = RefreshToken(refresh_token)
               token.blacklist()
               ip_address = get_client_ip(request)
               UserActivityLog.objects.create(
                   user=request.user,
                   action="logout_success",
                   ip_address=ip_address,
                   details="User logged out successfully"
               )
               logger.info(f"LogoutView: User {request.user.email} logged out successfully")
               return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
           except Exception as e:
               logger.error(f"LogoutView: Failed to logout user {request.user.email} - {str(e)}")
               return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)