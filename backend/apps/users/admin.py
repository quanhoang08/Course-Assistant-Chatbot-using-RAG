from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Thêm các trường tự custom vào giao diện chỉnh sửa
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin cá nhân', {'fields': ('user_code', 'full_name', 'avatar', 'is_teacher')}),
    )
    
    list_display = ('username', 'user_code', 'full_name', 'is_teacher', 'is_active')
    list_filter = ('is_teacher', 'is_staff', 'is_active')
    search_fields = ('username', 'user_code', 'full_name')