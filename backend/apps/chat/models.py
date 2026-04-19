from django.db import models
from django.conf import settings
from apps.courses.models import Course
from django.contrib.auth.models import User


def course_pdf_path(instance, filename):
    return f'courses/pdfs/{instance.course.course_code}/{filename}'

class Conversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='conversations'
    )
    # Tham chiếu đến class Course
    course = models.ForeignKey(
        'courses_app.Course', 
        on_delete=models.CASCADE, 
        related_name='conversations'
    )
    title = models.CharField(max_length=255, default="Cuộc trò chuyện mới")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.course.name} ({self.created_at.strftime('%d/%m/%Y')})"

class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Cuộc hội thoại mới")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('ai', 'AI Assistant'),
    )
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Luôn hiển thị tin nhắn theo thứ tự thời gian tăng dần
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

def ai_document_path(instance, filename):
    return f'courses/ai_knowledge/{instance.course.course_code}/{filename}'

class AIDocument(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    file = models.FileField(upload_to=ai_document_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name

    class Meta:
        verbose_name = "AI Knowledge Base" 
        verbose_name_plural = "AI Knowledge Bases"

