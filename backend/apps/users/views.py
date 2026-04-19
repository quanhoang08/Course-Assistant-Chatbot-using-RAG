from django.shortcuts import render
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.models import SocialAccount

class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    #callback_url = "http://localhost:5173"
    client_class = OAuth2Client
    callback_url = "http://localhost:5173"

    def get_response(self):
        response = super().get_response()
        response.data['is_teacher'] = self.user.is_staff 
        try:
            social_account = SocialAccount.objects.get(user=self.user, provider='google')
            avatar_url = social_account.extra_data.get('picture')
            response.data['avatar'] = avatar_url
        except SocialAccount.DoesNotExist:
            response.data['avatar'] = None
        return response
