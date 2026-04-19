from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Course, Document
from .serializers import CourseSerializer

class UserCourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Course.objects.filter(Q(students=user) | Q(teacher=user)).distinct()

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) 

    def post(self, request, *args, **kwargs):
        course_id = request.data.get('course_id')
        uploaded_file = request.FILES.get('file')

        if not course_id or not uploaded_file:
            return Response({"error": "Thiếu course_id hoặc file tài liệu"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
            if course.teacher != request.user: 
                return Response({"error": "Bạn không có quyền upload tài liệu cho môn này!"}, status=status.HTTP_403_FORBIDDEN)
            document = Document.objects.create(
                course=course,
                title=uploaded_file.name,
                file=uploaded_file
            )

            return Response({
                "message": "Upload thành công.",
                "document_id": document.id
            }, status=status.HTTP_201_CREATED)

        except Course.DoesNotExist:
            return Response({"error": "Không tìm thấy khóa học"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CourseDocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            documents = Document.objects.filter(course_id=course_id).order_by('-uploaded_at')
            
            data = []
            for doc in documents:
                data.append({
                    "id": doc.id,
                    "name": doc.file.name.split('/')[-1], 
                    "url": request.build_absolute_uri(doc.file.url),
                    "uploadedAt": doc.uploaded_at.strftime("%d/%m/%Y %H:%M")
                })
                
            return Response(data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)