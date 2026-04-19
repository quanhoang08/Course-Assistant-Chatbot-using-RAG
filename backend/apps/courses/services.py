import os
os.environ["ANONYMIZED_TELEMETRY"] = "False" 
os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"

from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma


def process_and_embed_document(document_instance):
    try:
        file_path = document_instance.file_path
        course_code = document_instance.course.course_code
        
        #Đọc file PDF (Parsing)
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        
        #Cắt nhỏ văn bản (Chunking)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(pages)

        print(f"[DEBUG RAG] File PDF này cắt được: {len(chunks)} đoạn văn bản.", flush=True)
        if len(chunks) == 0:
            print("CẢNH BÁO: File PDF không có chữ, dạng scan, hoặc rỗng!", flush=True)
            return
        
        #"Trích dẫn nguồn" (Source Citation)
        for chunk in chunks:
            chunk.metadata['source_title'] = document_instance.title
            chunk.metadata['page'] = chunk.metadata.get('page', 0) + 1
            
        #Chuyển đổi thành Vector (Embedding)
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY # Đảm bảo bạn đã khai báo trong settings.py
        )
        
        #Lưu vào ChromaDB
        vector_db_path = "/app/data/vector_db"
        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=vector_db_path,
            collection_name=f"course_{course_code}"
        )
        
        vector_db.persist()

        document_instance.is_processed = True
        document_instance.save(update_fields=['is_processed'])
        print(f"Đã xử lý xong file: {document_instance.title}", flush=True)
        
    except Exception as e:
        print(f"Lỗi khi xử lý file {document_instance.title}: {str(e)}", flush=True)
