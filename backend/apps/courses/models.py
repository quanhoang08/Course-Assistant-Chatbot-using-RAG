from django.db import models
from django.conf import settings
import os

class Course(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên môn học")
    course_code = models.CharField(max_length=50, unique=True, verbose_name="Mã môn học")
    description = models.TextField(blank=True, null=True)
    
    #Giáo viên phụ trách 1 (hoặc nhiều) môn học
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Giáo viên nghỉ làm thì môn học vẫn còn
        null=True,
        blank=True,
        related_name='teaching_courses',
        limit_choices_to={'is_teacher': True}, #Chỉ hiển thị user là giáo viên
        verbose_name="Giáo viên phụ trách"
    )
    
    # Nhiều sinh viên học 1 môn (và ngược lại)
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='enrolled_courses',
        blank=True,
        limit_choices_to={'is_teacher': False}, # Chỉ hiển thị user là sinh viên
        verbose_name="Danh sách sinh viên"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course_code} - {self.name}"

def get_upload_path(instance, filename):
    course_code = instance.course.course_code
    return os.path.join('courses', 'pdfs', course_code, filename)

class Document(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=get_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.course.course_code})"
    
    @property
    def file_path(self):
        return self.file.path
