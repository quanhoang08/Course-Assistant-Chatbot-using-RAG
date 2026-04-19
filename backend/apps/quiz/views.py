from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Quiz, Question, Choice, StudentQuizResult
from apps.courses.models import Course
from .services import generate_quiz_from_ai

# [YÊU CẦU 4 - Quiz] Các APIs cho chức năng Quiz

class GenerateQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        topic = request.data.get('topic')
        num_questions = request.data.get('num_questions', 5)
        difficulty = request.data.get('difficulty', 'medium')

        try:
            course = Course.objects.get(id=course_id)
            is_valid_user = (course.teacher == request.user) or request.user.is_superuser or course.students.filter(id=request.user.id).exists()
            if not is_valid_user:
                return Response({"error": "Bạn không có quyền truy cập môn học này!"}, status=403)
            
            quiz, error_msg = generate_quiz_from_ai(course, topic, num_questions, difficulty)
            if quiz:
                return Response({"message": "Tạo quiz thành công", "quiz_id": quiz.id})
            return Response({"error": f"{error_msg}"}, status=400)
        except Course.DoesNotExist:
            return Response({"error": "Không tìm thấy lớp học"}, status=404)

class CourseQuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        quizzes = Quiz.objects.filter(course_id=course_id).order_by('-created_at')
        data = []
        for q in quizzes:
            data.append({
                "id": q.id,
                "title": q.title,
                "created_at": q.created_at.strftime("%d/%m/%Y"),
                "question_count": q.questions.count()
            })
        return Response(data)

class QuizDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            
            if not quiz.is_public:
                if not request.user.is_authenticated:
                    return Response({"error": "Yêu cầu đăng nhập để xem"}, status=401)
                
                is_owner = (quiz.course.teacher == request.user)
                is_student = quiz.course.students.filter(id=request.user.id).exists()
                is_shared = quiz.shared_users.filter(id=request.user.id).exists()
                if not (is_owner or is_student or is_shared or request.user.is_superuser):
                    return Response({"error": "Bạn không có quyền xem bài tập này"}, status=403)

            questions = []
            for question in quiz.questions.all():
                choices = []
                for choice in question.choices.all():
                    choices.append({
                        "id": choice.id,
                        "content": choice.content,
                        "is_correct": choice.is_correct,
                        "explanation": choice.explanation
                    })
                questions.append({
                    "id": question.id,
                    "content": question.content,
                    "choices": choices
                })
            return Response({
                "id": quiz.id,
                "title": quiz.title,
                "course_id": quiz.course.id,
                "questions": questions,
                "is_public": quiz.is_public,
                "shared_users": [u.email for u in quiz.shared_users.all()]
            })
        except Quiz.DoesNotExist:
            return Response({"error": "Không tìm thấy Quiz"}, status=404)

class QuizManageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            if quiz.course.teacher != request.user and not request.user.is_superuser:
                # Nếu sinh viên là người bấm tạo bài, trong prototype chưa lưu owner của quiz (chỉ lưu course).
                # Tạm thời cứ cho những người thuộc course là được sửa tên quiz của mình tự tạo.
                pass 
                
            new_title = request.data.get('title')
            if new_title:
                quiz.title = new_title
                quiz.save()
            return Response({"message": "Đã đổi tên Quiz"})
        except Quiz.DoesNotExist:
            return Response({"error": "Không tìm thấy Quiz"}, status=404)

    def delete(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            quiz.delete()
            return Response({"message": "Đã xóa Quiz"})
        except Quiz.DoesNotExist:
            return Response({"error": "Không tìm thấy Quiz"}, status=404)

class QuizShareAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)

            # [BẢO MẬT] Chỉ giáo viên sở hữu quiz mới được chỉnh sửa quyền chia sẻ
            is_owner = (quiz.course.teacher == request.user) or request.user.is_superuser
            if not is_owner:
                return Response({"error": "Bạn không có quyền chỉnh sửa quyền chia sẻ Quiz này!"}, status=403)

            is_public_raw = request.data.get('is_public')
            emails = request.data.get('emails', [])
            
            if is_public_raw is not None:
                if str(is_public_raw).lower() == 'true':
                    quiz.is_public = True
                else:
                    quiz.is_public = False
            
            # Clear old and add new ones
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            quiz.shared_users.clear()
            for email in emails:
                user = User.objects.filter(email=email).first()
                if not user:
                    # Tự động tạo user tạm thời nếu chia sẻ cho người ngoài hệ thống
                    user = User.objects.create(email=email, username=email.split('@')[0], is_active=False)
                quiz.shared_users.add(user)
                    
            quiz.save()
            return Response({"message": "Đã cập nhật quyền chia sẻ"})
        except Quiz.DoesNotExist:
            return Response({"error": "Không tìm thấy Quiz"}, status=404)

class CheckEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        email = request.data.get('email')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=email).exists():
            return Response({"exists": True})
        return Response({"exists": False})


class SubmitQuizAPIView(APIView):
    """[YÊU CẦU 4 - Nộp bài] Nhận đáp án từ client, tính điểm và lưu StudentQuizResult."""
    permission_classes = [AllowAny]  # Người dùng public link vẫn submit được (không lưu DB nếu chưa login)

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Không tìm thấy Quiz"}, status=404)

        # answers = [{"question_id": 1, "choice_id": 3}, ...]
        answers = request.data.get('answers', [])
        if not answers:
            return Response({"error": "Không có đáp án nào được gửi"}, status=400)

        # Tính điểm
        score = 0
        total = 0
        answer_map = {str(a['question_id']): a['choice_id'] for a in answers if 'question_id' in a and 'choice_id' in a}

        for question in quiz.questions.all():
            total += 1
            chosen_id = answer_map.get(str(question.id))
            if chosen_id:
                try:
                    choice = question.choices.get(id=chosen_id)
                    if choice.is_correct:
                        score += 1
                except Choice.DoesNotExist:
                    pass

        # Lưu vào DB chỉ khi đã đăng nhập
        if request.user.is_authenticated:
            StudentQuizResult.objects.create(
                user=request.user,
                quiz=quiz,
                score=score,
                total_questions=total,
            )

        return Response({
            "score": score,
            "total_questions": total,
            "percentage": round((score / total * 100) if total > 0 else 0, 1),
            "saved": request.user.is_authenticated,
        })
