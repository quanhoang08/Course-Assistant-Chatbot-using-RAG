import os
import json
from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from .models import Quiz, Question, Choice

# Tắt Telemetry của ChromaDB để tránh lỗi capture()
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"

VECTOR_DB_PATH = "/app/data/vector_db"
EMBEDDING_MODEL = "models/gemini-embedding-001"

# [YÊU CẦU 4 - Quiz] Hàm sinh quiz bằng AI (RAG - chỉ dùng nội dung từ PDF)
def generate_quiz_from_ai(course, topic, num_questions=5, difficulty='medium'):
    # Ánh xạ độ khó sang hướng dẫn cho LLM
    difficulty_map = {
        'easy':   'MỨC DỄ: Câu hỏi kiểm tra định nghĩa, khái niệm cơ bản, ghi nhớ trực tiếp từ tài liệu.',
        'medium': 'MỨC TRUNG BÌNH: Câu hỏi yêu cầu hiểu biết và vận dụng căn bản, kết hợp nhiều khái niệm.',
        'hard':   'MỨC KHÓ: Câu hỏi yêu cầu phân tích sâu, so sánh, đánh giá hoặc vận dụng tổng hợp cao.',
    }
    difficulty_instruction = difficulty_map.get(difficulty, difficulty_map['medium'])
    # 0. Validate đầu vào
    try:
        num_questions = int(num_questions)
    except (ValueError, TypeError):
        return None, "Số câu hỏi không hợp lệ."
    
    if num_questions < 1:
        return None, "Số câu hỏi phải lớn hơn 0."
    
    if num_questions > 20:
        return None, "Số câu hỏi tối đa là 20."
    
    if not topic:
        topic = "Tổng hợp kiến thức"
    
    # 1. Tìm thông tin từ vector db (RAG - bắt buộc có nội dung PDF)
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=settings.GOOGLE_API_KEY
    )
    vectorstore = Chroma(
        persist_directory=VECTOR_DB_PATH,
        embedding_function=embeddings,
        collection_name=f"course_{course.course_code}"
    )
    
    # Kiểm tra số lượng phần tử thực tế trong index để tránh lỗi "k > count"
    max_k = 6
    try:
        collection_count = vectorstore._collection.count()
        actual_k = min(max_k, collection_count)
    except:
        actual_k = max_k

    if actual_k <= 0:
        return None, "Hết lượt hoặc không tìm thấy nội dung tài liệu môn học. Hãy tải lên tài liệu PDF trước nhé!"

    docs = vectorstore.similarity_search(topic, k=actual_k)
    
    # [RAG] Nếu không có nội dung trong PDF, trả lỗi - KHÔNG để LLM tự bịa
    if not docs:
        return None, f"Không tìm thấy nội dung về chủ đề '{topic}' trong tài liệu môn học. Hãy tải lên tài liệu PDF trước hoặc thử chủ đề khác."
    
    # Xây dựng context từ PDF với thông tin nguồn
    context_parts = []
    for idx, doc in enumerate(docs):
        title = doc.metadata.get('source_title', 'Tài liệu môn học')
        page = doc.metadata.get('page', 'N/A')
        context_parts.append(f"[Nguồn: {title}, Trang {page}]\n{doc.page_content}")
    
    context = "\n\n---\n\n".join(context_parts)

    # 2. Gọi LLM sinh JSON - CHỈ dựa trên context từ PDF
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview",
        temperature=0.5,
        google_api_key=settings.GOOGLE_API_KEY
    )
    
    prompt = PromptTemplate.from_template("""
Bạn là giảng viên chuyên nghiệp. Hãy tạo đúng {num} câu hỏi trắc nghiệm DỰA HOÀN TOÀN VÀO NỘI DUNG TÀI LIỆU bên dưới.

ĐỘ KHÓ YÊU CẦU: {difficulty_instruction}

QUY TẮC BẮT BUỘC CHỐNG BỊA ĐẶT (HALLUCINATION):
- CHỈ sử dụng kiến thức có trong phần [Nội dung tài liệu] bên dưới.
- Nếu Chủ đề yêu cầu ("{topic}") LÀ MỘT TỪ KHÓA CỤ THỂ VÀ TÀI LIỆU BÊN DƯỚI THỰC SỰ KHÔNG CÓ BẤT CỨ THÔNG TIN NÀO LIÊN QUAN ĐẾN NÓ, HÃY TRẢ VỀ CHÍNH XÁC CHUỖI JSON SAU: 
{{
  "error": "Tài liệu môn học không có thông tin về chủ đề này. Hãy thử chủ đề khác."
}}
- KHÔNG BAO GIỜ bịa ra thông tin. KHÔNG BAO GIỜ dùng kiến thức bên ngoài.

Chủ đề yêu cầu: {topic}

[Nội dung tài liệu]:
{context}

Nếu tạo được câu hỏi, định dạng đầu ra BẮT BUỘC là JSON mảng hợp lệ như sau:
[
  {{
    "question": "Nội dung câu hỏi?",
    "choices": [
      {{"content": "Đáp án A", "is_correct": true, "explanation": "Giải thích ngắn gọn dựa trên tài liệu"}},
      {{"content": "Đáp án B", "is_correct": false, "explanation": "Giải thích ngắn gọn"}},
      {{"content": "Đáp án C", "is_correct": false, "explanation": "Giải thích ngắn gọn"}},
      {{"content": "Đáp án D", "is_correct": false, "explanation": "Giải thích ngắn gọn"}}
    ]
  }}
]
""")
    response = llm.invoke(prompt.format(num=num_questions, topic=topic, context=context, difficulty_instruction=difficulty_instruction))
    
    import re

    try:
        # Lấy JSON hợp lệ từ phản hồi bằng biểu thức chính quy (Regex)
        data_str = response.content.strip()
        match = re.search(r'\[\s*\{.*\}\s*\]', data_str, re.DOTALL)
        if match:
            data_str = match.group(0)
        else:
            data_str = data_str.replace("```json", "").replace("```", "").strip()

        quiz_data = json.loads(data_str)
        
        # Nếu LLM xác nhận không tìm thấy chủ đề trong tài liệu, nó sẽ trả về Object có chứa "error"
        if isinstance(quiz_data, dict) and "error" in quiz_data:
             return None, quiz_data["error"]
             
        if not quiz_data or not isinstance(quiz_data, list):
            return None, "AI không tạo được câu hỏi từ nội dung tài liệu này. Hãy thử chủ đề khác."
        
        # 3. Lưu vào DB
        quiz = Quiz.objects.create(course=course, title=f"Quiz: {topic}")
        for q_item in quiz_data:
            question = Question.objects.create(quiz=quiz, content=q_item.get("question", "N/A"))
            for c_item in q_item.get("choices", []):
                Choice.objects.create(
                    question=question, 
                    content=c_item.get("content", "N/A"), 
                    is_correct=c_item.get("is_correct", False),
                    explanation=c_item.get("explanation", "")
                )
        return quiz, None
    except Exception as e:
        error_msg = str(e)
        print("Lỗi sinh quiz:", error_msg)
        return None, error_msg
