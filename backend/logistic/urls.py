from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileViewSet, CompanyViewSet, ShipmentViewSet, RequestViewSet,
    FinanceList, FinanceDetail, ShipmentCalculationViewSet, 
    send_email, get_balance, counterparty_balance, analytics_summary,
    ShipmentStatusViewSet, RequestStatusViewSet
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
    
    # Маршруты для пользователей
    path('clients/', UserProfileViewSet.as_view({'get': 'clients'}), name='clients_list'),
    
    # Маршруты для отправлений
    path('shipments/<int:pk>/create-folder/', ShipmentViewSet.as_view({'post': 'shipment_create_folder'}), name='shipment-create-folder'),
    path('shipments/<int:pk>/upload-files/', ShipmentViewSet.as_view({'post': 'upload_files'}), name='shipment-upload-files'),
    path('shipments/<int:pk>/download-file/<int:file_id>/', ShipmentViewSet.as_view({'get': 'shipment_download_file'}), name='shipment-download-file'),
    path('shipments/<int:pk>/files/<int:file_id>/', ShipmentViewSet.as_view({'delete': 'delete_file'}), name='delete_shipment_file'),
    path('shipments/<int:pk>/folders/<int:folder_id>/', ShipmentViewSet.as_view({'delete': 'delete_folder'}), name='delete_shipment_folder'),
    path('shipments/<int:pk>/files/', ShipmentViewSet.as_view({'get': 'get_files'}), name='shipment_files'),
    
    # Маршруты для заявок
    path('requests/<int:pk>/upload-files/', RequestViewSet.as_view({'post': 'request_upload_files'}), name='request-upload-files'),
    path('requests/<int:pk>/download-file/<int:file_id>/', RequestViewSet.as_view({'get': 'request_download_file'}), name='request-download-file'),
    path('requests/<int:pk>/files/<int:file_id>/', RequestViewSet.as_view({'delete': 'delete_file'}), name='delete_file'),
    
    # Маршруты для расчетов
    path('shipment-calculations/<int:pk>/calculate-costs/', ShipmentCalculationViewSet.as_view({'post': 'calculate_costs'}), name='calculate_costs'),
    path('shipment-calculations/<int:pk>/expenses/', ShipmentCalculationViewSet.as_view({'get': 'get_expenses'}), name='get_expenses'),
    path('shipment-calculations/<int:pk>/related-requests/', ShipmentCalculationViewSet.as_view({'get': 'calculation_related_requests'}), name='calculation_related_requests'),
    path('shipment-calculations/by-shipment/<int:shipment_id>/', ShipmentCalculationViewSet.as_view({'get': 'get_by_shipment'}), name='get_calculation_by_shipment'),
    
    # Маршруты для финансов
    path('finance/', FinanceList.as_view(), name='finance-list'),
    path('finance/<int:number>/', FinanceDetail.as_view(), name='finance-detail'),
    path('finance/balance/', get_balance, name='finance-balance'),
    path('finance/counterparty-balance/', counterparty_balance, name='counterparty-balance'),
    
    # Маршруты для аналитики
    path('analytics/summary/', analytics_summary, name='analytics-summary'),
    
    # Другие маршруты
    path('send-email/', send_email, name='send_email'),
]