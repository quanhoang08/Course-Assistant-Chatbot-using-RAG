import json
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.courses.models import Course
from .models import ChatSession, Message
from .services import iter_rag_answer_stream

class ChatAgentStreamAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        user_message = request.data.get('message')
        session_id = request.data.get('session_id')
        selected_model = request.data.get('model', 'gemini-2.5-flash')
        if selected_model not in ('gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'):
            selected_model = 'gemini-2.5-flash'

        user = request.user
        
        if not course_id or not user_message:
            return StreamingHttpResponse(
                iter([json.dumps({"error": "Thiếu course_id hoặc message"})]), 
                content_type="application/json", status=status.HTTP_400_BAD_REQUEST
            )

        try:
            course = Course.objects.get(id=course_id)
            if session_id:
                session = ChatSession.objects.get(id=session_id, user=user)
            else:
                title = user_message[:30] + "..." if len(user_message) > 30 else user_message
                session = ChatSession.objects.create(user=user, course=course, title=title)

            # Lịch sử trò chuyện (cùng định dạng chuỗi như ChatEchoAPIView / get_rag_answer)
            past_messages = list(
                reversed(Message.objects.filter(session=session).order_by("-timestamp")[:6])
            )
            chat_history_str = ""
            for msg in past_messages:
                role_name = "Sinh viên" if msg.role == "user" else "AI"
                content_clean = msg.content.split("\n\nNguồn tham khảo:")[0]
                chat_history_str += f"{role_name}: {content_clean}\n"

            # Lưu tin nhắn user
            Message.objects.create(session=session, role='user', content=user_message)

            def event_stream():
                # Yield meta event trước để frontend bắt session_id
                yield f"data: {json.dumps({'type': 'meta', 'session_id': session.id})}\n\n"
                
                try:
                    # RAG + stream (chỉ chunk SSE, không gửi dòng trạng thái "Đang tra cứu..." để tránh lỗi hiển thị/ghép chuỗi)
                    full_response = ""
                    for text in iter_rag_answer_stream(
                        course_code=course.course_code,
                        user_message=user_message,
                        user_id=str(user.id),
                        chat_history=chat_history_str,
                        model_name=selected_model,
                    ):
                        full_response = text
                        # `full` = toàn bộ phản hồi model tới chunk này (frontend gán, không nối chuỗi)
                        yield f"data: {json.dumps({'type': 'chunk', 'full': text})}\n\n"

                    if full_response.strip():
                        Message.objects.create(session=session, role="ai", content=full_response)
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"

                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

            return StreamingHttpResponse(event_stream(), content_type='text/event-stream')

        except Course.DoesNotExist:
             return StreamingHttpResponse(iter([json.dumps({"error": "Không tìm thấy"})]), status=404)
        except ChatSession.DoesNotExist:
             return StreamingHttpResponse(iter([json.dumps({"error": "Session lỗi"})]), status=400)
