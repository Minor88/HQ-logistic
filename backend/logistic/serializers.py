from rest_framework import serializers
from .models import (
    UserProfile, Company, Shipment, Request, 
    RequestFile, ShipmentFolder, ShipmentFile, 
    Article, Finance, ShipmentCalculation, ShipmentStatus, RequestStatus
)
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes


class UserProfileUserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели User.
    Используется в UserProfileSerializer.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email']


class CompanySerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели компании.
    Предоставляет все поля модели Company.
    """
    class Meta:
        model = Company
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели UserProfile.
    """
    user = UserProfileUserSerializer()
    company_name = serializers.CharField(source='company.name', read_only=True)
    role_display = serializers.CharField(source='get_user_group_display', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'company', 'company_name', 'user_group', 'role_display', 'phone', 'is_active']
        read_only_fields = ['id', 'user', 'company', 'company_name', 'user_group', 'role_display', 'phone', 'is_active']


class RequestFileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для файлов заявок.
    Включает дополнительное поле для отображения имени загрузившего пользователя.
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = RequestFile
        fields = ['id', 'file', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ShipmentFolderSerializer(serializers.ModelSerializer):
    """
    Сериализатор для папок отправок.
    Включает дополнительное поле для отображения имени создавшего пользователя.
    """
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    files = serializers.SerializerMethodField()
    
    class Meta:
        model = ShipmentFolder
        fields = ['id', 'name', 'created_by', 'created_by_name', 'created_at', 'files']
        read_only_fields = ['created_at']
    
    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_files(self, obj):
        """
        Метод для получения всех файлов, находящихся в данной папке.
        """
        files = obj.files.all()
        from .serializers import ShipmentFileSerializer  # Импорт здесь для избежания циклических зависимостей
        return ShipmentFileSerializer(files, many=True).data


class ShipmentFileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для файлов отправок.
    Включает дополнительные поля для отображения имени папки и загрузившего пользователя.
    """
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = ShipmentFile
        fields = ['id', 'file', 'folder', 'folder_name', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ArticleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для статей расходов/доходов.
    Включает дополнительное поле для отображения названия компании.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Article
        fields = ['id', 'name', 'company', 'company_name']


class ShipmentCalculationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для расчетов отправок.
    Предоставляет все поля модели ShipmentCalculation.
    """
    class Meta:
        model = ShipmentCalculation
        fields = '__all__'


class RequestListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка заявок.
    Включает основные поля для отображения в списке и дополнительные поля
    для отображения связанных объектов.
    """
    client_name = serializers.CharField(source='client.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    shipment_number = serializers.CharField(source='shipment.number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Request
        fields = [
            'id', 'number', 'company', 'company_name', 'description', 'warehouse_number', 
            'col_mest', 'declared_weight', 'declared_volume', 'actual_weight', 
            'actual_volume', 'status', 'status_display', 'client', 'client_name', 
            'manager', 'manager_name', 'shipment', 'shipment_number', 'created_at'
        ]
        read_only_fields = ['created_at']


class RequestDetailSerializer(RequestListSerializer):
    """
    Расширенный сериализатор для детального отображения заявки.
    Наследует все поля от RequestListSerializer и добавляет дополнительные
    поля для детального отображения, включая связанные файлы.
    """
    files = RequestFileSerializer(many=True, read_only=True)
    
    class Meta(RequestListSerializer.Meta):
        fields = RequestListSerializer.Meta.fields + ['rate', 'comment', 'files']


class ShipmentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentStatus
        fields = ['id', 'code', 'name', 'is_default', 'is_final', 'order']
        read_only_fields = ['created_at']


class ShipmentListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка отправок.
    Включает основные поля для отображения в списке и дополнительные поля
    для отображения связанных объектов и вычисляемых значений.
    """
    status_display = serializers.CharField(source='status.name', read_only=True)
    status_code = serializers.CharField(source='status.code', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    requests_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'number', 'company', 'company_name', 'status', 'status_code',
            'status_display', 'created_at', 'created_by', 'created_by_name',
            'requests_count', 'comment'
        ]
        read_only_fields = ['created_at', 'requests_count']
    
    def get_requests_count(self, obj: Shipment) -> int:
        """
        Вычисляет количество заявок, связанных с отправкой.
        """
        return obj.request_set.count()


class ShipmentDetailSerializer(ShipmentListSerializer):
    """
    Расширенный сериализатор для детального отображения отправки.
    Наследует все поля от ShipmentListSerializer и добавляет дополнительные
    поля для детального отображения, включая связанные папки, файлы, заявки и расчеты.
    """
    folders = ShipmentFolderSerializer(many=True, read_only=True)
    files = ShipmentFileSerializer(many=True, read_only=True)
    requests = RequestListSerializer(source='request_set', many=True, read_only=True)
    calculation = ShipmentCalculationSerializer(read_only=True)
    
    class Meta(ShipmentListSerializer.Meta):
        fields = ShipmentListSerializer.Meta.fields + ['comment', 'folders', 'files', 'requests', 'calculation']


class FinanceListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка финансовых операций.
    Включает основные поля для отображения в списке и дополнительные поля
    для отображения связанных объектов и текстовых значений выборов.
    """
    operation_type_display = serializers.CharField(source='get_operation_type_display', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    article_name = serializers.CharField(source='article.name', read_only=True)
    counterparty_name = serializers.CharField(source='counterparty.get_full_name', read_only=True)
    shipment_number = serializers.CharField(source='shipment.number', read_only=True)
    request_number = serializers.CharField(source='request.number', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Finance
        fields = [
            'number', 'company', 'company_name', 'operation_type', 'operation_type_display', 
            'payment_date', 'document_type', 'document_type_display', 'currency', 
            'currency_display', 'counterparty', 'counterparty_name', 'article', 
            'article_name', 'amount', 'is_paid', 'shipment', 'shipment_number', 
            'request', 'request_number', 'created_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'number']


class FinanceDetailSerializer(FinanceListSerializer):
    """
    Расширенный сериализатор для детального отображения финансовой операции.
    Наследует все поля от FinanceListSerializer и добавляет дополнительные
    поля для детального отображения, включая информацию о связанной финансовой операции (основании).
    """
    basis_number = serializers.IntegerField(source='basis.number', read_only=True)
    
    class Meta(FinanceListSerializer.Meta):
        fields = FinanceListSerializer.Meta.fields + ['comment', 'basis', 'basis_number']


class RequestStatusSerializer(serializers.ModelSerializer):
    """
    Сериализатор для статусов заявок.
    """
    class Meta:
        model = RequestStatus
        fields = ['id', 'code', 'name', 'is_default', 'is_final', 'order']
        read_only_fields = ['created_at']


class RequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='status.name', read_only=True)
    status_code = serializers.CharField(source='status.code', read_only=True)
    
    class Meta:
        model = Request
        fields = [
            'id', 'number', 'status', 'status_display', 'status_code',
            'client', 'manager', 'shipment', 'created_at', 'updated_at',
            'rate', 'comment'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AnalyticsSummarySerializer(serializers.Serializer):
    total_shipments = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipments_by_status = serializers.DictField(child=serializers.IntegerField())
    requests_by_status = serializers.DictField(child=serializers.IntegerField())
    revenue_by_currency = serializers.DictField(child=serializers.DecimalField(max_digits=10, decimal_places=2))
    expenses_by_currency = serializers.DictField(child=serializers.DecimalField(max_digits=10, decimal_places=2))


class BalanceSerializer(serializers.Serializer):
    """
    Сериализатор для баланса компании.
    """
    income = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Доходы по валютам"
    )
    expenses = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Расходы по валютам"
    )
    balance = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Баланс по валютам"
    )


class CounterpartyBalanceSerializer(serializers.Serializer):
    """
    Сериализатор для баланса контрагентов.
    """
    id = serializers.IntegerField(help_text="ID контрагента")
    name = serializers.CharField(help_text="Название контрагента")
    balances = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Балансы по валютам"
    )


class EmailSerializer(serializers.Serializer):
    """
    Сериализатор для отправки email.
    """
    sender_email = serializers.EmailField(help_text="Email отправителя")
    sender_name = serializers.CharField(help_text="Имя отправителя", required=False, default="Логистическая компания")
    recipient_email = serializers.EmailField(help_text="Email получателя")
    subject = serializers.CharField(help_text="Тема письма", required=False, default="Уведомление от логистической компании")
    message_plain = serializers.CharField(help_text="Текстовое сообщение", required=False, default="")
    message_html = serializers.CharField(help_text="HTML сообщение", required=False, default="")

    def to_representation(self, instance):
        return {
            'sender_email': instance.get('sender_email'),
            'sender_name': instance.get('sender_name', 'Логистическая компания'),
            'recipient_email': instance.get('recipient_email'),
            'subject': instance.get('subject', 'Уведомление от логистической компании'),
            'message_plain': instance.get('message_plain', ''),
            'message_html': instance.get('message_html', '')
        }