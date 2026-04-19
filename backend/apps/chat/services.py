import os
from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain.chains.question_answering import load_qa_chain
from langchain_core.messages import HumanMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"

VECTOR_DB_PATH = "/app/data/vector_db"
EMBEDDING_MODEL = "models/gemini-embedding-001"


def _retrieve_course_docs(course_code, user_message, user_id, max_k=3):
    """
    Truy vấn Chroma cho môn học. Trả về (docs, err_msg):
    err_msg là None nếu có docs; ngược lại là thông báo hiển thị cho người dùng.
    """
    print(f"[CHAT] Khóa học: course_{course_code}")
    search_query = user_message
    print(f"Câu gốc (Người dùng nhập): {user_message}")
    print(f"Câu đem đi search DB: {search_query}")

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

    try:
        collection_count = vectorstore._collection.count()
        actual_k = min(max_k, collection_count)
    except Exception:
        actual_k = max_k

    if actual_k <= 0:
        return [], "Dạ, hiện tại em chưa tìm thấy tài liệu nào được nạp vào hệ thống để trả lời ạ."

    docs = vectorstore.similarity_search(
        search_query,
        k=actual_k,
        filter=search_filter
    )

    if not docs:
        return [], "Xin lỗi, mình không tìm thấy thông tin nào trong tài liệu môn học liên quan đến câu hỏi này."

    return docs, None


RAG_PROMPT_TEMPLATE = """
        Bạn là một trợ lý giảng dạy AI cho sinh viên đại học TDTU.
        
        Dưới đây là các đoạn thông tin trích xuất từ tài liệu. Mỗi đoạn đều có ghi rõ tên file và số trang.
        Nhiệm vụ của bạn:
        1. CHỈ SỬ DỤNG thông tin từ các đoạn trích này để trả lời.
        2. Những đoạn trích KHÔNG liên quan đến câu hỏi thì PHỚT LỜ hoàn toàn.
        3. Nếu không có đoạn trích nào chứa câu trả lời, hãy nói: "Dạ em chưa tìm thấy thông tin này trong tài liệu môn học ạ."
        4. NẾU CÓ TRẢ LỜI, BẮT BUỘC phải liệt kê những tài liệu mà bạn THỰC SỰ ĐÃ DÙNG ở cuối câu trả lời theo đúng định dạng sau:
        
        Nguồn tham khảo:
        - [Tên file] (Trang [Số trang])

        Lịch sử trò chuyện:
        {chat_history}
        
        Context (Các đoạn trích xuất):
        {context}

        Câu hỏi của sinh viên: {question}
        Câu trả lời chi tiết:
        """


def get_rag_answer(course_code, user_message, user_id, chat_history="", model_name="gemini-3.1-flash-lite-preview"):
    try:
        docs, err_msg = _retrieve_course_docs(course_code, user_message, user_id, max_k=3)
        if err_msg is not None:
            return err_msg

        for doc in docs:
            title = doc.metadata.get('source_title', 'Tài liệu không tên')
            page = doc.metadata.get('page', 'N/A')
            doc.page_content = f"--- Bắt đầu trích đoạn từ file: {title} (Trang {page}) ---\n{doc.page_content}\n--- Kết thúc trích đoạn ---\n"

        print(f"Đang khởi tạo AI thực tế với model: {model_name}")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.1,
            google_api_key=settings.GOOGLE_API_KEY
        )

        prompt = PromptTemplate(template=RAG_PROMPT_TEMPLATE, input_variables=["chat_history", "context", "question"])
        chain = load_qa_chain(llm, chain_type="stuff", prompt=prompt)
        response = chain.invoke({"input_documents": docs, "question": user_message, "chat_history": chat_history})
        final_answer = response["output_text"]
        
        return final_answer

    except Exception as e:
        print(f"Lỗi RAG Service: {str(e)}")
        if "429" in str(e):
            return "Hệ thống AI đang quá tải lượt hỏi đáp. Vui lòng đợi 1 phút rồi thử lại nhé!"
        return f"Hệ thống AI đang gặp sự cố: {str(e)}"


def iter_rag_answer_stream(
    course_code, user_message, user_id, chat_history="", model_name="gemini-3.1-flash-lite-preview"
):
    """
    Stream câu trả lời RAG giống get_rag_answer (truy vấn Chroma + một lần gọi LLM),
    không dùng Agent/tool calling — tránh lỗi thought_signature trên Gemini 2.5+.
    """
    try:
        docs, err_msg = _retrieve_course_docs(course_code, user_message, user_id, max_k=3)
        if err_msg is not None:
            yield err_msg
            return

        for doc in docs:
            title = doc.metadata.get("source_title", "Tài liệu không tên")
            page = doc.metadata.get("page", "N/A")
            doc.page_content = (
                f"--- Bắt đầu trích đoạn từ file: {title} (Trang {page}) ---\n"
                f"{doc.page_content}\n--- Kết thúc trích đoạn ---\n"
            )

        context = "\n\n".join(d.page_content for d in docs)
        prompt = PromptTemplate(
            template=RAG_PROMPT_TEMPLATE, input_variables=["chat_history", "context", "question"]
        )
        prompt_text = prompt.format(
            chat_history=chat_history,
            context=context,
            question=user_message,
        )

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.1,
            google_api_key=settings.GOOGLE_API_KEY,
        )

        acc = ""

        def _chunk_to_str(chunk) -> str:
            raw = getattr(chunk, "content", None)
            if raw is None and isinstance(chunk, str):
                raw = chunk
            if raw is None:
                return ""
            if isinstance(raw, list):
                parts = []
                for p in raw:
                    if isinstance(p, str):
                        parts.append(p)
                    elif isinstance(p, dict) and p.get("type") == "text":
                        parts.append(p.get("text", ""))
                    else:
                        parts.append(str(p))
                return "".join(parts)
            return str(raw)

        for chunk in llm.stream([HumanMessage(content=prompt_text)]):
            text = _chunk_to_str(chunk)
            if not text:
                continue
            # Gom về chuỗi đầy đủ tới chunk này; frontend gán `full` mỗi lần (không +=).
            # Chỉ dùng: (1) mở rộng prefix cumulative (2) bỏ chunk trùng ngắn (3) nối delta.
            # KHÔNG thay acc = text khi len(text)>=len(acc) nhưng không phải prefix — dễ ghi đè
            # bằng đoạn giữa câu (ví dụ "số động từ URL.") và làm mất phần đầu phản hồi.
            if text.startswith(acc):
                acc = text
            elif acc.startswith(text):
                continue
            else:
                acc += text
            yield acc
    except Exception as e:
        print(f"Lỗi RAG Stream: {str(e)}")
        if "429" in str(e):
            yield "Hệ thống AI đang quá tải lượt hỏi đáp. Vui lòng đợi 1 phút rồi thử lại nhé!"
        else:
            yield f"Hệ thống AI đang gặp sự cố: {str(e)}"


def ingest_document(course_code, file_obj, user_id):
    temp_path = None
    try:
        temp_dir = os.path.join(settings.MEDIA_ROOT, "temp")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file_obj.name)
        
        with open(temp_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        loader = PyPDFLoader(temp_path)
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        texts = text_splitter.split_documents(documents)
        print(f"[UPLOAD] Nạp vào giỏ: course_{course_code} | Cắt được: {len(texts)} đoạn text")

        for text in texts:
            text.metadata["course_code"] = course_code
            text.metadata["source_title"] = file_obj.name
            text.metadata["user_id"] = str(user_id)

        embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY
        )

        Chroma.from_documents(
            documents=texts,
            embedding=embeddings,
            persist_directory=VECTOR_DB_PATH,
            collection_name=f"course_{course_code}"
        )
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return True

    except Exception as e:
        print(f"Ingest Error: {e}")
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return False