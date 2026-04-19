from django.urls import path
from .views import ChatEchoAPIView, ChatHistoryAPIView, ChatUploadAPIView, ChatSessionListView
from .views import ChatSessionDetailAPIView, ChatSessionDeleteAllAPIView
from .stream_views import ChatAgentStreamAPIView

urlpatterns = [
    path('chat/stream/', ChatAgentStreamAPIView.as_view(), name='chat-stream'),
    path('chat/sessions/<int:session_id>/', ChatSessionDetailAPIView.as_view(), name='chat_session_detail'),
    path('chat/echo/', ChatEchoAPIView.as_view(), name='chat-echo'),
    path('chat/history/', ChatHistoryAPIView.as_view(), name='chat_history'),
    path('chat/upload/', ChatUploadAPIView.as_view(), name='chat_upload'),
    path('chat/sessions/', ChatSessionListView.as_view(), name='chat-sessions'),
    path('chat/sessions/delete_all/', ChatSessionDeleteAllAPIView.as_view(), name='chat-delete-all'),
]