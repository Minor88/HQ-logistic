from django.contrib import admin
from .models import (
    UserProfile, Company, Shipment, Request, 
    RequestFile, ShipmentFolder, ShipmentFile, 
    Article, Finance, ShipmentCalculation
)

class UserProfileAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления профилями пользователей.
    Настроен вывод основных полей, фильтры и поиск.
    """
    list_display = ('user', 'name', 'phone', 'user_group', 'company', 'is_active')
    list_filter = ('user_group', 'is_active', 'company')
    search_fields = ('user__username', 'name', 'phone')
    autocomplete_fields = ['company']

class CompanyAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления компаниями.
    Отображает основную информацию о компаниях и настраивает поиск.
    """
    list_display = ('name', 'phone', 'email', 'created_at')
    search_fields = ('name', 'phone', 'email')

class ShipmentAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления отправками.
    Отображает информацию об отправках, предоставляет фильтры и поиск.
    """
    list_display = ('number', 'company', 'status', 'created_at', 'created_by')
    list_filter = ('status', 'company')
    search_fields = ('number', 'comment')
    autocomplete_fields = ['company', 'created_by']

class RequestAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления заявками.
    Отображает основную информацию о заявках, настраивает фильтры и поиск.
    """
    list_display = ('number', 'company', 'client', 'status', 'created_at')
    list_filter = ('status', 'company')
    search_fields = ('number', 'description', 'client__name', 'client__user__username')
    autocomplete_fields = ['company', 'client', 'manager', 'shipment']

class FinanceAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления финансовыми операциями.
    Предоставляет подробную информацию о финансовых операциях, фильтры и поиск.
    """
    list_display = ('number', 'company', 'operation_type', 'payment_date', 'currency', 'amount', 'is_paid')
    list_filter = ('operation_type', 'document_type', 'currency', 'is_paid', 'company')
    search_fields = ('comment', 'number')
    autocomplete_fields = ['company', 'counterparty', 'article', 'shipment', 'request', 'basis', 'created_by']

class ArticleAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления статьями расходов/доходов.
    Отображает информацию о статьях и предоставляет фильтрацию по компании.
    """
    list_display = ('name', 'company')
    list_filter = ('company',)
    search_fields = ('name',)
    autocomplete_fields = ['company']

class ShipmentCalculationAdmin(admin.ModelAdmin):
    """
    Админ-класс для управления расчетами отправок.
    Отображает информацию о расчетах и связанных отправках.
    """
    list_display = ('shipment', 'euro_rate', 'usd_rate')
    autocomplete_fields = ['shipment']

# Регистрируем модели и соответствующие им админ-классы
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Company, CompanyAdmin)
admin.site.register(Shipment, ShipmentAdmin)
admin.site.register(Request, RequestAdmin)
admin.site.register(RequestFile)
admin.site.register(ShipmentFolder)
admin.site.register(ShipmentFile)
admin.site.register(Article, ArticleAdmin)
admin.site.register(Finance, FinanceAdmin)
admin.site.register(ShipmentCalculation, ShipmentCalculationAdmin)