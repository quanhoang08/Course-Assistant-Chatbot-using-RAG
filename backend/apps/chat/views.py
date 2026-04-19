from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
from apps.courses.models import Course
from django.contrib.auth import get_user_model
from .services import get_rag_answer
from rest_framework.permissions import IsAuthenticated
from .serializers import MessageSerializer
from .models import AIDocument
from rest_framework.parsers import MultiPartParser, FormParser
from .services import ingest_document #??????
from .models import ChatSession


User = get_user_model()

class ChatEchoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        user_message = request.data.get('message')
        session_id = request.data.get('session_id')
        selected_model = request.data.get('model', 'gemini-2.5-flash')
        if selected_model not in ('gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'):
            selected_model = 'gemini-2.5-flash'

        print(f"[Frontend] yêu cầu dùng model: {selected_model}")
        user = request.user
        user_id = str(user.id) 

        if not course_id or not user_message:
            return Response({"error": "Thiếu course_id hoặc message"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
            
            if session_id:
                session = ChatSession.objects.get(id=session_id, user=user)
            else:
                title = user_message[:30] + "..." if len(user_message) > 30 else user_message
                session = ChatSession.objects.create(user=user, course=course, title=title)

            past_messages = Message.objects.filter(session=session).order_by('-timestamp')[:6]
            past_messages = reversed(past_messages)

            chat_history_str = ""
            for msg in past_messages:
                role_name = "Sinh viên" if msg.role == 'user' else "AI"
                content_clean = msg.content.split("\n\nNguồn tham khảo:")[0]
                chat_history_str += f"{role_name}: {content_clean}\n"

            Message.objects.create(session=session, role='user', content=user_message)

            ai_response = get_rag_answer(
                course_code=course.course_code, 
                user_message=user_message, 
                user_id=user_id,
                chat_history=chat_history_str,
                model_name=selected_model
            )

            Message.objects.create(session=session, role='ai', content=ai_response)


            return Response({
                "session_id": session.id, 
                "user_message": user_message,
                "ai_response": ai_response
            }, status=status.HTTP_200_OK)

        except Course.DoesNotExist:
            return Response({"error": "Môn học không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except ChatSession.DoesNotExist:
            return Response({"error": "Phiên chat không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)


class ChatHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get('course_id')
        session_id = request.query_params.get('session_id') 
        
        if not course_id:
            return Response({"error": "Thiếu course_id"}, status=400)

        if not session_id or session_id == 'null':
            return Response([], status=200)

        try:
            session = ChatSession.objects.get(id=session_id, user=request.user, course_id=course_id)
            messages = Message.objects.filter(session=session).order_by('timestamp')
            
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data, status=200)
            
        except ChatSession.DoesNotExist:
            return Response([], status=200)
        
class ChatUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        course_id = request.data.get('course_id')
        file_obj = request.FILES.get('file')
        user_id = str(request.user.id)

        if not course_id or not file_obj:
            return Response({"error": "Thiếu course_id hoặc file"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(id=course_id)

            AIDocument.objects.create(course=course, file=file_obj)
            file_obj.seek(0)
            
            course_name_for_vector = course.course_code 
            
            success = ingest_document(course_name_for_vector, file_obj, user_id)

            if success:
                return Response({
                    "message": f"Tài liệu '{file_obj.name}' đã được nạp vào môn {course.name} ({course.course_code}) thành công!"
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": "Lỗi trong quá trình nạp kiến thức vào AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Course.DoesNotExist:
            return Response({"error": "Môn học không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "Thiếu course_id"}, status=400)
        try:
            documents = AIDocument.objects.filter(course_id=course_id).order_by('-uploaded_at')
            data = []
            for doc in documents:
                data.append({
                    "id": doc.id,
                    "name": doc.file.name.split('/')[-1],
                    "uploadedAt": doc.uploaded_at.strftime("%d/%m/%Y %H:%M")
                })
            return Response(data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "Thiếu tham số course_id"}, status=400)
        try:
            sessions = ChatSession.objects.filter(
                user=request.user, 
                course_id=course_id
            ).order_by('-created_at').values('id', 'title', 'created_at')
            return Response(list(sessions), status=200)
        except Exception as e:
            print("Lỗi khi lấy Session:", str(e))
            return Response({"error": f"Lỗi Server: {str(e)}"}, status=500)

class ChatSessionDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
            session.delete()
            return Response({"message": "Đã xóa thành công"}, status=200)
        except ChatSession.DoesNotExist:
            return Response({"error": "Không tìm thấy phiên chat"}, status=404)

class ChatSessionDeleteAllAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            deleted_count, _ = ChatSession.objects.filter(user=request.user).delete()
            return Response({
                "message": f"Đã xóa thành công {deleted_count} phiên trò chuyện."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Lỗi server: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)