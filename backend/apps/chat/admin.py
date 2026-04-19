from django.contrib import admin
from .models import ChatSession, Message, AIDocument

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ('role', 'content', 'timestamp')
    readonly_fields = ('timestamp',)

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'course', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'user__username')
    inlines = [MessageInline]

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'role', 'timestamp') 
    list_filter = ('role', 'timestamp')
    search_fields = ('content',)

@admin.register(AIDocument)
class AIDocumentAdmin(admin.ModelAdmin):
    list_display = ('file', 'course', 'uploaded_at')


#tetst