from django.urls import path
from .views import UserCourseListView, DocumentUploadView
from .views import CourseDocumentListView

urlpatterns = [
    path('<int:course_id>/documents/', CourseDocumentListView.as_view(), name='course_documents'),
    path('', UserCourseListView.as_view(), name='user_courses'),
    path('upload-document/', DocumentUploadView.as_view(), name='upload_document')
    
]