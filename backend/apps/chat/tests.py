from rest_framework.test import APITestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from apps.courses.models import Course
from unittest.mock import patch

User = get_user_model()

class ChatUploadTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.course = Course.objects.create(name="Lập trình mạng", course_code="IT001")
        self.client.force_authenticate(user=self.user)

    @patch('apps.chat.views.ingest_document') 
    def test_upload_file(self, mock_ingest):
        mock_ingest.return_value = True
        
        url = reverse('chat_upload')
        pdf_file = SimpleUploadedFile("test.pdf", b"fake pdf content", content_type="application/pdf")
        
        data = {'course_id': self.course.id, 'file': pdf_file}
        response = self.client.post(url, data, format='multipart')

        if response.status_code != 201:
            print(f"Response data: {response.data}")

        self.assertEqual(response.status_code, 201)
        print("Unit Test: API Upload đã thông suốt")