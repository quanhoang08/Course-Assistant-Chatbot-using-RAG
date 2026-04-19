import os
import json
from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.prompts import PromptTemplate
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_community.tools import DuckDuckGoSearchRun

# Tắt Telemetry của ChromaDB để tránh lỗi capture()
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"

VECTOR_DB_PATH = "/app/data/vector_db"
EMBEDDING_MODEL = "models/gemini-embedding-001"

# [YÊU CẦU 4 - Agent] Function calling tools
@tool
def get_exam_schedule(course_code: str) -> str:
    """Trả về lịch thi cuối kỳ hoặc giữa kỳ của môn học dựa trên mã môn (Ví dụ: 501042). 
    Sử dụng tool này khi sinh viên hỏi về lịch thi, ngày thi, giờ thi."""
    # Giả lập logic truy vấn cơ sở dữ liệu
    mock_db = {
        "501042": "Lịch thi môn 501042: Ngày 25/12/2026, Ca 3 (13:00 - 15:00), Phòng A301.",
        "501043": "Lịch thi môn 501043: Ngày 28/12/2026, Ca 1 (07:00 - 09:00), Phòng C201."
    }
    return mock_db.get(course_code, f"Hiện chưa có lịch thi chính thức cho môn {course_code}. Vui lòng theo dõi thông báo trên cổng sinh viên.")

@tool
def search_course_materials(query: str, course_code: str, user_id: str) -> str:
    """Tìm kiếm thông tin, kiến thức chuyên ngành từ tài liệu của môn học (PDF, DOCX) thông qua cơ chế RAG.
    Sử dụng tool này với mọi câu hỏi liên quan đến kiến thức lý thuyết, bài tập của môn học.
    Hãy chắc chắn truyền chính xác query và course_code."""
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=settings.GOOGLE_API_KEY
    )

    vectorstore = Chroma(
        persist_directory=VECTOR_DB_PATH,
        embedding_function=embeddings,
        collection_name=f"course_{course_code}"
    )

    search_filter = {
        "$or": [
            {"is_public": True},
            {"user_id": str(user_id)}
        ]
    }

    # Semantic Search
    # Kiểm tra số lượng phần tử thực tế trong index để tránh lỗi "k > count"
    max_k = 4
    try:
        collection_count = vectorstore._collection.count()
        actual_k = min(max_k, collection_count)
    except:
        actual_k = max_k

    if actual_k <= 0:
        return "Tài liệu môn học của bạn hiện chưa có nội dung nào được nạp vào. Hãy dùng tool search_web nếu cần kiến thức bên ngoài."

    docs = vectorstore.similarity_search(query, k=actual_k, filter=search_filter)
    
    # [YÊU CẦU 4 - Hybrid Search] BM25 Keyword Search có thể được áp dụng ở đây
    # Tuy nhiên vì Chroma chưa lưu text raw toàn cục hiệu quả, ta demo bm25 từ kết quả docs.
    # Trong thực tế sẽ cần load lại toàn bộ doc để build bm25. 
    # Tạm thời để giảm tải bộ nhớ, chỉ dùng semantic search làm nguồn cung cấp chính cho Agent
    # Nếu muốn thật sự kết hợp, cần tạo file lưu bm25 obj riêng biệt lúc ingest.
    
    if not docs:
        return "Không tìm thấy nội dung liên quan trong tài liệu môn học."

    context_text = ""
    for idx, doc in enumerate(docs):
        title = doc.metadata.get('source_title', 'Tài liệu không tên')
        page = doc.metadata.get('page', 'N/A')
        context_text += f"---\nNguồn: [{title}] (Trang {page})\nNội dung: {doc.page_content}\n"
    
    return context_text

def get_agent_executor(model_name="gemini-2.5-flash", user_id=""):
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.1,
        google_api_key=settings.GOOGLE_API_KEY
    )

    # Web search tool (fallback khi PDF không có thông tin)
    _ddg_search = DuckDuckGoSearchRun()

    @tool
    def search_web(query: str) -> str:
        """Tìm kiếm thông tin trên internet (web). Dùng tool này CHỈ KHI:
        1. Tài liệu môn học không có thông tin đáp ứng câu hỏi
        2. Câu hỏi yêu cầu thông tin bên ngoài hoặc mởi nhất
        KHÔNG dùng tool này để tra cứu kiến thức chuyên môn có trong tài liệu."""
        try:
            result = _ddg_search.run(query)
            return f"[Tìm kiếm web]: {result}"
        except Exception as e:
            return f"Tìm kiếm thất bại: {str(e)}"

    tools = [
        get_exam_schedule,
        search_course_materials,
        search_web
    ]

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""Bạn là trợ giảng AI thân thiện, giúp sinh viên giải đáp thắc mắc về môn học.
Bạn có quyền truy cập vào các công cụ (tools) sau:

**ƯU TIÊN SỬ DỤNG TOOLS:**
1. Đầu tiên, Nếu sinh viên hỏi về kiến thức môn học - HAY DÙNG `search_course_materials` (tìm trong PDF).
2. Nếu `search_course_materials` trả về "không tìm thấy" hoặc câu hỏi cần thông tin bên ngoài - dùng `search_web` để bổ sung.
3. Hỏi về lịch thi - dùng `get_exam_schedule`.

**QUY TẮC TRẢ LỜI:**
- Ưu tiên nội dung tài liệu PDF hơn thông tin web
- Khi dùng `search_course_materials`, TRÍCH DẪN rõ nguồn: "Nguồn tham khảo:\n- [Tên file] (Trang X)"
- Khi dùng `search_web`, ghi rõ "Đây là thông tin từ web, không có trong tài liệu môn hỌc"
- Truyền đúng course_code vào tool `search_course_materials`; tham số user_id của tool phải luôn là chuỗi sau (không đổi): {user_id!r}
"""),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return agent_executor
