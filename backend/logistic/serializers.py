from rest_framework import serializers
from .models import (
    UserProfile, Company, Shipment, Request, 
    RequestFile, ShipmentFolder, ShipmentFile, 
    Article, Finance, ShipmentCalculation
)
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для стандартной модели пользователя Django.
    Используется для отображения основной информации о пользователе.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


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
    Сериализатор для профиля пользователя.
    Включает вложенный сериализатор пользователя Django и дополнительные поля
    для отображения текстовых значений выборов и связанных объектов.
    """
    user = UserSerializer(read_only=True)
    user_group_display = serializers.CharField(source='get_user_group_display', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'company', 'company_name', 'name', 'phone', 'comment', 'user_group', 'user_group_display', 'is_active']


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
    
    class Meta:
        model = ShipmentFolder
        fields = ['id', 'name', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['created_at']


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


class ShipmentListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка отправок.
    Включает основные поля для отображения в списке и дополнительные поля
    для отображения связанных объектов и вычисляемых значений.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    requests_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'number', 'company', 'company_name', 'status', 'status_display', 
            'created_at', 'created_by', 'created_by_name', 'requests_count'
        ]
        read_only_fields = ['created_at', 'requests_count']
    
    def get_requests_count(self, obj):
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