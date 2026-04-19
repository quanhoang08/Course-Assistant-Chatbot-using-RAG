from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document
from .services import process_and_embed_document
import threading

@receiver(post_save, sender=Document)
def document_post_save(sender, instance, created, **kwargs):
    if created and not instance.is_processed:
        print(f"-BẮT ĐẦU XỬ LÝ- Đẩy file '{instance.title}' vào tác vụ nền...", flush=True)
        
        # Bật lại Thread để web load ngay lập tức
        thread = threading.Thread(target=process_and_embed_document, args=(instance,))
        thread.start()