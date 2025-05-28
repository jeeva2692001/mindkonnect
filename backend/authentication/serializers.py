from rest_framework import serializers
from .models import CustomUser, UserActivityLog
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'mobile_number', 'date_of_birth', 'nhs_number', 'nhs_consent']
        read_only_fields = ['id', 'email', 'nhs_consent']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    mobile_number = serializers.CharField(max_length=15)
    date_of_birth = serializers.DateField()
    nhs_number = serializers.CharField(max_length=10, required=False, allow_blank=True)
    nhs_consent = serializers.BooleanField(default=False)

    def validate_mobile_number(self, value):
        # Ensure the mobile number starts with a '+' followed by at least one digit
        if not re.match(r'^\+\d+$', value):
            raise serializers.ValidationError(
                "Mobile number must start with a '+' followed by the country code and number (e.g., +447123456789)."
            )
        return value

    def create(self, validated_data):
        """Create a new CustomUser instance."""
        return CustomUser.objects.create_user(**validated_data)

class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = ['action', 'timestamp', 'ip_address', 'details']