from django.urls import path
from .views import GenerateQuizAPIView, CourseQuizListView, QuizDetailAPIView, QuizManageAPIView, QuizShareAPIView, CheckEmailAPIView, SubmitQuizAPIView

urlpatterns = [
    path('generate/', GenerateQuizAPIView.as_view(), name='quiz-generate'),
    path('course/<int:course_id>/', CourseQuizListView.as_view(), name='quiz-list'),
    path('check-email/', CheckEmailAPIView.as_view(), name='check-email'),
    path('<int:quiz_id>/', QuizDetailAPIView.as_view(), name='quiz-detail'),
    path('<int:quiz_id>/manage/', QuizManageAPIView.as_view(), name='quiz-manage'),
    path('<int:quiz_id>/share/', QuizShareAPIView.as_view(), name='quiz-share'),
    path('<int:quiz_id>/submit/', SubmitQuizAPIView.as_view(), name='quiz-submit'),
]
