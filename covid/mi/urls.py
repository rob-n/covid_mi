from django.urls import path
from . import views

from rest_framework import routers

router = routers.DefaultRouter()
# router.register(r'mi', views.)
urlpatterns = [
    path('case/', views.CaseList.as_view(), name='case-detail'),
    # path('api/death/', include(router.urls)),
    path('', views.IndexView.as_view(), name='index'),
]
