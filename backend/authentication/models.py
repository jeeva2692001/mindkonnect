from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, mobile_number, date_of_birth, nhs_number='', nhs_consent=False):
        if not email:
            raise ValueError('Users must have an email address')

        user = self.model(
            email=self.normalize_email(email),
            first_name=first_name,
            last_name=last_name,
            mobile_number=mobile_number,
            date_of_birth=date_of_birth,
            nhs_number=nhs_number,
            nhs_consent=nhs_consent,
        )
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, mobile_number, date_of_birth):
        user = self.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            mobile_number=mobile_number,
            date_of_birth=date_of_birth,
        )
        user.is_admin = True
        user.save(using=self._db)
        return user

class CustomUser(AbstractBaseUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    mobile_number = models.CharField(max_length=15)
    date_of_birth = models.DateField()
    nhs_number = models.CharField(max_length=10, blank=True, default='', null=False)
    nhs_consent = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'mobile_number', 'date_of_birth']

    # Override password-related methods to disable password usage
    def set_password(self, raw_password=None):
        raise NotImplementedError("Passwords are not used in this system. Authentication is OTP-based.")

    def check_password(self, raw_password):
        raise NotImplementedError("Passwords are not used in this system. Authentication is OTP-based.")

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin

class UserActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=100)  # e.g., "login_success", "otp_failed"
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True)  # Additional info, e.g., "Invalid OTP"

    class Meta:
        verbose_name = "User Activity Log"
        verbose_name_plural = "User Activity Logs"

    def __str__(self):
        return f"{self.user.email} - {self.action} at {self.timestamp}"