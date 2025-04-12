from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileViewSet, CompanyViewSet, ShipmentViewSet, RequestViewSet,
    FinanceList, FinanceDetail, ShipmentCalculationViewSet,
    ShipmentStatusViewSet, RequestStatusViewSet, AnalyticsSummaryView,
    BalanceView, CounterpartyBalanceView, EmailView
)

# Создаем роутер DRF для автоматической маршрутизации ViewSets
router = DefaultRouter()
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'shipments', ShipmentViewSet)
router.register(r'requests', RequestViewSet)
router.register(r'shipment-statuses', ShipmentStatusViewSet)
router.register(r'request-statuses', RequestStatusViewSet)
router.register(r'shipment-calculations', ShipmentCalculationViewSet)

urlpatterns = [
    # Включаем все маршруты из роутера
    path('', include(router.urls)),
    
    # Маршруты для аналитики
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    
    # Маршруты для финансов
    path('finance/', FinanceList.as_view(), name='finance-list'),
    path('finance/<int:number>/', FinanceDetail.as_view(), name='finance-detail'),
    path('finance/balance/', BalanceView.as_view(), name='balance'),
    path('finance/counterparty-balance/', CounterpartyBalanceView.as_view(), name='counterparty-balance'),
    
    # Маршруты для email
    path('email/send/', EmailView.as_view(), name='send-email'),
]