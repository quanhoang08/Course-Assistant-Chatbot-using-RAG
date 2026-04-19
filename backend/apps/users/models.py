from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    user_code = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="Mã số (MSSV/MSGV)")
    full_name = models.CharField(max_length=255, verbose_name="Họ và tên")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    is_teacher = models.BooleanField(default=False, verbose_name="Là giảng viên")

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Danh sách Người dùng'

    def __str__(self):
        role = "Giảng viên" if self.is_teacher else ("Admin" if self.is_superuser else "Sinh viên")
        code = self.user_code if self.user_code else "Chưa cập nhật"
        return f"[{role}] {self.username} - {code}"
