from rest_framework import viewsets, status, generics
from .models import UserProfile, Shipment, Request, RequestFile, ShipmentFile, ShipmentFolder, Article, Finance, ShipmentCalculation, Company, ShipmentStatus, RequestStatus
from .serializers import UserProfileSerializer, ShipmentListSerializer, ShipmentDetailSerializer, RequestListSerializer, RequestDetailSerializer, RequestFileSerializer, ShipmentFileSerializer, ShipmentFolderSerializer, ArticleSerializer, FinanceListSerializer, FinanceDetailSerializer, ShipmentCalculationSerializer, CompanySerializer, ShipmentStatusSerializer, RequestStatusSerializer, AnalyticsSummarySerializer, BalanceSerializer, CounterpartyBalanceSerializer, EmailSerializer, RequestSerializer
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes, schema
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
import os
from django.http import HttpResponseBadRequest, FileResponse, Http404, JsonResponse
from urllib.parse import unquote
from django.utils.encoding import smart_str  # для безопасного декодирования в UTF-8
import shutil
from django.core.mail import send_mail
from django.contrib.auth.models import User
import smtplib
import ssl
import certifi
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.db.models import Sum, Count
from decimal import Decimal, ROUND_HALF_UP
from .permissions import (
    IsSuperuser, IsCompanyAdmin, IsCompanyBoss, 
    IsCompanyManager, IsCompanyWarehouse, IsCompanyClient,
    IsOwnerOrReadOnly, IsCompanyMember
)
from django.shortcuts import get_object_or_404
from django.conf import settings
import json
import datetime
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from rest_framework.renderers import JSONRenderer
from rest_framework.schemas import AutoSchema
from rest_framework import permissions


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления компаниями.
    
    Обеспечивает стандартные CRUD-операции для модели Company.
    Доступен только для суперпользователей для создания/удаления.
    Администраторы могут только просматривать свою компанию.
    Поддерживает параметры:
    - search: поиск по имени, электронной почте, телефону и адресу
    - page: номер страницы для пагинации
    - limit: количество элементов на странице
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    def get_permissions(self):
        """
        Переопределяем для обработки разных типов запросов.
        
        Для любых изменений (создание, редактирование, удаление) - только суперпользователи.
        Для просмотра - суперпользователи и администраторы (админы видят только свою компанию).
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'admins', 'add_admin', 'remove_admin', 'update_admin']:
            # Для модификации данных - только суперпользователи
            return [IsSuperuser()]
        
        # Для просмотра - суперпользователи и администраторы
        return [IsSuperuser(), IsCompanyAdmin()]
    
    def get_queryset(self):
        """
        Переопределяет queryset в зависимости от роли пользователя.
        
        Суперпользователи видят все компании, администраторы - только свою.
        Остальные пользователи не видят компании.
        Поддерживает фильтрацию по параметрам запроса:
        - search: поиск по имени, электронной почте, телефону и адресу
        - page: номер страницы для пагинации
        - limit: количество элементов на странице
        """
        # Получаем базовый queryset в зависимости от роли пользователя
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            queryset = Company.objects.all()
        elif hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.user_group == 'admin' and self.request.user.userprofile.company:
            queryset = Company.objects.filter(id=self.request.user.userprofile.company.id)
        else:
            queryset = Company.objects.none()
        
        # Применяем фильтрацию по поисковому запросу, если он указан
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(address__icontains=search_query)
            )
        
        # Сортируем результаты
        queryset = queryset.order_by('name')  # Сортировка по умолчанию

        # Пагинация реализуется стандартными средствами DRF
        # Не нужно вручную реализовывать пагинацию, так как DRF
        # автоматически обрабатывает параметры page и page_size
        
        return queryset

    def perform_create(self, serializer):
        company = serializer.save()
        self._create_default_statuses(company)
    
    def _create_default_statuses(self, company):
        """
        Создает стандартные статусы для новой компании.
        """
        # Статусы для заявок
        request_statuses = [
            {'code': 'new', 'name': 'Новая заявка', 'is_default': True, 'is_final': False, 'order': 1},
            {'code': 'expected', 'name': 'Ожидается на складе', 'is_default': False, 'is_final': False, 'order': 2},
            {'code': 'on_warehouse', 'name': 'Формируется', 'is_default': False, 'is_final': False, 'order': 3},
            {'code': 'in_progress', 'name': 'В работе', 'is_default': False, 'is_final': False, 'order': 4},
            {'code': 'ready', 'name': 'Готово к выдаче', 'is_default': False, 'is_final': False, 'order': 5},
            {'code': 'delivered', 'name': 'Доставлено', 'is_default': False, 'is_final': True, 'order': 6}
        ]
        
        # Статусы для отправок
        shipment_statuses = [
            {'code': 'at_warehouse', 'name': 'На складе', 'is_default': True, 'is_final': False, 'order': 1},
            {'code': 'document_preparation', 'name': 'Подготовка документов', 'is_default': False, 'is_final': False, 'order': 2},
            {'code': 'departed', 'name': 'Отправлен', 'is_default': False, 'is_final': False, 'order': 3},
            {'code': 'in_transit', 'name': 'В пути', 'is_default': False, 'is_final': False, 'order': 4},
            {'code': 'delivered', 'name': 'Доставлен', 'is_default': False, 'is_final': True, 'order': 5},
            {'code': 'cancelled', 'name': 'Отменен', 'is_default': False, 'is_final': True, 'order': 6}
        ]
        
        # Создаем статусы для заявок
        for status_data in request_statuses:
            RequestStatus.objects.create(company=company, **status_data)
            
        # Создаем статусы для отправок
        for status_data in shipment_statuses:
            ShipmentStatus.objects.create(company=company, **status_data)

    @action(detail=True, methods=['get'])
    def admins(self, request, pk=None):
        """
        Возвращает список администраторов компании.
        """
        company = self.get_object()
        admins = UserProfile.objects.filter(company=company, user_group='admin')
        serializer = UserProfileSerializer(admins, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_admin(self, request, pk=None):
        """
        Добавляет нового администратора для компании.
        
        Создает нового пользователя с ролью 'admin' и привязывает его к компании.
        """
        company = self.get_object()
        
        # Получаем данные из запроса
        email = request.data.get('email')
        username = request.data.get('username', email)  # Если логин не указан, используем email
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone', '')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {"error": "Email и пароль обязательны"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, существует ли пользователь с таким email или username
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Пользователь с таким email уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Пользователь с таким логином уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем пользователя
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Создаем профиль с ролью администратора
        profile = UserProfile.objects.create(
            user=user,
            company=company,
            user_group='admin',
            phone=phone,
            name=f"{first_name} {last_name}".strip()  # Формируем имя из first_name и last_name
        )
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path=r'admins/(?P<user_id>\d+)')
    def remove_admin(self, request, pk=None, user_id=None):
        """
        Удаляет администратора компании.
        """
        company = self.get_object()
        
        try:
            profile = UserProfile.objects.get(id=user_id, company=company, user_group='admin')
            user = profile.user
            
            # Удаляем профиль и пользователя
            profile.delete()
            user.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Администратор не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['put'], url_path=r'update_admin/(?P<user_id>\d+)')
    def update_admin(self, request, pk=None, user_id=None):
        """
        Обновляет данные администратора компании.
        
        Позволяет изменить email, имя, фамилию, телефон и пароль администратора.
        Пароль обновляется только если он предоставлен в запросе.
        """
        company = self.get_object()
        
        try:
            profile = UserProfile.objects.get(id=user_id, company=company, user_group='admin')
            user = profile.user
            
            # Получаем данные из запроса
            email = request.data.get('email')
            username = request.data.get('username')
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            phone = request.data.get('phone')
            password = request.data.get('password')
            
            # Проверяем email на уникальность, если он был изменен
            if email and email != user.email:
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    return Response(
                        {"error": "Пользователь с таким email уже существует"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.email = email
            
            # Проверяем username на уникальность, если он был изменен
            if username and username != user.username:
                if User.objects.filter(username=username).exclude(id=user.id).exists():
                    return Response(
                        {"error": "Пользователь с таким логином уже существует"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.username = username
            
            # Обновляем остальные поля, если они были предоставлены
            if first_name is not None:
                user.first_name = first_name
            
            if last_name is not None:
                user.last_name = last_name
            
            # Обновляем пароль только если он предоставлен и не пустой
            if password and password.strip():
                user.set_password(password)
            
            # Обновляем поле name в профиле пользователя
            if first_name is not None or last_name is not None:
                new_first_name = first_name if first_name is not None else user.first_name
                new_last_name = last_name if last_name is not None else user.last_name
                profile.name = f"{new_first_name} {new_last_name}".strip()
            
            # Обновляем телефон в профиле
            if phone is not None:
                profile.phone = phone
            
            # Сохраняем изменения
            user.save()
            profile.save()
            
            # Возвращаем обновленные данные
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
            
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Администратор не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления профилями пользователей.
    
    Обеспечивает стандартные CRUD-операции для модели UserProfile.
    Доступен только для администраторов и руководителей компаний.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def check_permissions(self, request):
        super().check_permissions(request)
        
        has_perm = False
        for permission_class in [IsSuperuser, IsCompanyAdmin, IsCompanyBoss]:
            permission = permission_class()
            if permission.has_permission(request, self):
                has_perm = True
                break
        
        if not has_perm:
            self.permission_denied(
                request,
                message="У вас нет прав для выполнения этой операции."
            )
    
    def get_queryset(self):
        """
        Переопределяет queryset в зависимости от роли пользователя.
        
        Суперпользователи видят всех пользователей, администраторы и руководители - 
        только пользователей своей компании.
        """
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            return UserProfile.objects.all()
        
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            company = self.request.user.userprofile.company
            return UserProfile.objects.filter(company=company)
        
        return UserProfile.objects.none()

    @action(detail=False, methods=['get'])
    def clients(self, request):
        """
        Возвращает список только тех пользователей, которые имеют роль 'client'.
        
        Используется для получения списка клиентов компании.
        """
        queryset = self.get_queryset().filter(user_group='client', is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Возвращает профиль текущего пользователя.
        
        Используется для получения информации о текущем пользователе.
        Доступно для всех аутентифицированных пользователей.
        """
        if hasattr(request.user, 'userprofile'):
            serializer = self.get_serializer(request.user.userprofile)
            return Response(serializer.data)
        return Response({'detail': 'Профиль пользователя не найден.'}, status=404)

    @action(detail=False, methods=['post'], permission_classes=[IsCompanyAdmin])
    def create_user(self, request):
        """
        Создает нового пользователя компании с заданной ролью.
        
        Доступно только для администраторов и руководителей компаний.
        Администратор может создавать пользователей только для своей компании.
        """
        email = request.data.get('email')
        username = request.data.get('username', email)
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone', '')
        password = request.data.get('password')
        user_group = request.data.get('user_group')
        
        if not email or not password or not user_group:
            return Response(
                {"error": "Email, пароль и роль пользователя обязательны"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        allowed_roles = ['boss', 'manager', 'warehouse', 'client']
        if user_group not in allowed_roles:
            return Response(
                {"error": f"Недопустимая роль пользователя. Разрешены: {', '.join(allowed_roles)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Пользователь с таким email уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Пользователь с таким логином уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company = request.user.userprofile.company
        if not company:
            return Response(
                {"error": "Ваш профиль не привязан к компании"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        profile = UserProfile.objects.create(
            user=user,
            company=company,
            user_group=user_group,
            phone=phone,
            name=f"{first_name} {last_name}".strip()
        )
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ShipmentStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления статусами отправок.
    Редактирование доступно только администраторам компании.
    Чтение доступно для менеджеров, руководителей, сотрудников склада и клиентов.
    """
    serializer_class = ShipmentStatusSerializer
    queryset = ShipmentStatus.objects.all()
    
    def get_permissions(self):
        """
        Возвращает разные наборы разрешений в зависимости от действия.
        Для действий чтения (list, retrieve) - все сотрудники компании.
        Для действий изменения (create, update, delete) - только администраторы.
        """
        if self.action in ['list', 'retrieve', 'available_statuses']:
            # Для чтения разрешаем всем сотрудникам компании
            return [IsCompanyMember()]
        # Для создания, обновления, удаления - только админы
        return [IsCompanyAdmin()]

    def get_queryset(self):
        """
        Возвращает только статусы компании пользователя.
        """
        return ShipmentStatus.objects.filter(company=self.request.user.userprofile.company)

    def perform_create(self, serializer):
        """
        При создании статуса автоматически устанавливает компанию пользователя.
        """
        serializer.save(company=self.request.user.userprofile.company)

    @action(detail=False, methods=['get'])
    def available_statuses(self, request):
        statuses = ShipmentStatus.objects.filter(
            company=request.user.userprofile.company
        ).order_by('order')
        serializer = ShipmentStatusSerializer(statuses, many=True)
        return Response(serializer.data)


class ShipmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления отправками.
    
    Обеспечивает стандартные CRUD-операции для модели Shipment,
    а также дополнительные методы для работы с файлами и папками.
    Доступ:
    - Чтение и получение файлов: менеджеры, руководители, склад
    - Полное редактирование: менеджеры, руководители
    - Обновление статуса и комментария: сотрудники склада
    """
    queryset = Shipment.objects.all().order_by('-created_at')
    
    def get_permissions(self):
        """
        Возвращает разные наборы разрешений в зависимости от действия.
        """
        # Разрешаем доступ к специальному методу update_status для склада
        if self.action == 'update_status':
            return [IsCompanyWarehouse()]
        
        # Для создания, удаления и полного редактирования - менеджеры и выше
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsCompanyManager()]
            
        # Для просмотра, загрузки файлов, скачивания - склад и выше
        return [IsCompanyWarehouse()]
    
    def get_serializer_class(self):
        """
        Возвращает разные сериализаторы в зависимости от действия.
        
        Для детального просмотра используется расширенный сериализатор,
        для списка - упрощенный.
        """
        if self.action == 'retrieve':
            return ShipmentDetailSerializer
        return ShipmentListSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Shipment.objects.none()
        
        user_profile = user.userprofile
        company = user_profile.company
        
        if user_profile.user_group in ['superuser', 'admin']:
            return Shipment.objects.filter(company=company)
        elif user_profile.user_group == 'boss':
            return Shipment.objects.filter(company=company)
        elif user_profile.user_group == 'manager':
            return Shipment.objects.filter(company=company)
        elif user_profile.user_group == 'warehouse':
            # Разрешаем сотрудникам склада видеть все отправления компании
            return Shipment.objects.filter(company=company)
        elif user_profile.user_group == 'client':
            return Shipment.objects.filter(
                company=company,
                request__client=user_profile
            ).distinct()
        
        return Shipment.objects.none()
    
    def _create_default_statuses(self, company):
        """Создает дефолтные статусы для компании"""
        default_statuses = [
            {
                'code': 'at_warehouse',
                'name': 'На складе',
                'is_default': False,
                'is_final': False,
                'order': 1
            },
            {
                'code': 'document_preparation',
                'name': 'Подготовка документов',
                'is_default': False,
                'is_final': False,
                'order': 2
            },
            {
                'code': 'departed',
                'name': 'Отправлен',
                'is_default': False,
                'is_final': False,
                'order': 3
            },
            {
                'code': 'in_transit',
                'name': 'В пути',
                'is_default': False,
                'is_final': False,
                'order': 4
            },
            {
                'code': 'delivered',
                'name': 'Доставлен',
                'is_default': False,
                'is_final': True,
                'order': 5
            },
            {
                'code': 'cancelled',
                'name': 'Отменен',
                'is_default': False,
                'is_final': True,
                'order': 6
            }
        ]
        
        for status_data in default_statuses:
            ShipmentStatus.objects.get_or_create(
                company=company,
                code=status_data['code'],
                defaults=status_data
            )

    def perform_create(self, serializer):
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Получаем статус по умолчанию для компании
        default_status = ShipmentStatus.objects.filter(
            company=company,
            is_default=True
        ).first()
        
        if not default_status:
            # Если нет дефолтного статуса, создаем все статусы
            self._create_default_statuses(company)
            default_status = ShipmentStatus.objects.filter(
                company=company,
                is_default=True
            ).first()
            
            if not default_status:
                # Если все еще нет дефолтного статуса, берем первый
                default_status = ShipmentStatus.objects.filter(
                    company=company
                ).first()
                
                if not default_status:
                    raise ValidationError('Не удалось создать статусы для компании')
        
        serializer.save(
            company=company,
            created_by=user_profile,
            status=default_status
        )

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_files(self, request, pk=None):
        """
        Загружает файлы для отправки.
        
        Файлы могут быть загружены в корень или в конкретную папку отправки.
        """
        shipment_instance = self.get_object()
        files = request.FILES.getlist('files')
        folder_id = request.data.get('folder_id')

        if not files:
            return Response({"error": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)

        folder = None
        if folder_id:
            folder = ShipmentFolder.objects.get(id=folder_id)

        folder_path = os.path.join(
            settings.MEDIA_ROOT, 
            f'logistic/shipments/{shipment_instance.id}/{folder.name if folder else ""}'
        )

        os.makedirs(folder_path, exist_ok=True)

        created_files = []
        for file in files:
            file_path = os.path.join(folder_path, file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            file_obj = ShipmentFile.objects.create(
                shipment=shipment_instance, 
                file=file.name, 
                folder=folder,
                uploaded_by=getattr(request.user, 'userprofile', None)
            )
            created_files.append(file_obj)

        serializer = ShipmentFileSerializer(created_files, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='download-all-files', url_name='download_all_files')
    def download_all_files(self, request, pk=None):
        """
        Скачивает все файлы отправки.
        
        Возвращает все файлы отправки как вложения для скачивания.
        """
        try:
            shipment_instance = self.get_object()
            response = shipment_instance.get_files_zip()
            response['Content-Disposition'] = f'attachment; filename="shipment_{shipment_instance.number}_files.zip"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path=r'download-file/(?P<file_id>\d+)', url_name='download_single_file')
    def download_single_file(self, request, pk=None, file_id=None):
        """
        Скачивает конкретный файл отправки.
        
        Возвращает конкретный файл отправки для скачивания.
        """
        try:
            file_instance = ShipmentFile.objects.get(id=file_id, shipment_id=pk)
            file_path = file_instance.get_file_path()

            if not os.path.exists(file_path):
                raise Http404("Файл не найден")

            response = FileResponse(open(file_path, 'rb'), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{file_instance.file}"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
        except ShipmentFile.DoesNotExist:
            raise Http404("Файл не найден")

    @action(detail=True, methods=['delete'], url_path=r'files/(?P<file_id>\d+)')
    def delete_file(self, request, pk=None, file_id=None):
        """
        Удаляет файл отправки из базы данных и файловой системы.
        """
        try:
            file_instance = ShipmentFile.objects.get(id=file_id, shipment_id=pk)
            file_path = file_instance.get_file_path()

            if os.path.exists(file_path):
                os.remove(file_path)  # Удаление файла из файловой системы
            file_instance.delete()  # Удаление записи из базы данных
            return Response({"message": "Файл успешно удален"}, status=status.HTTP_204_NO_CONTENT)
        except ShipmentFile.DoesNotExist:
            return Response({"error": "Файл не найден"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='create-folder')
    def shipment_create_folder(self, request, pk=None):
        """
        Создает новую папку для отправки.
        """
        folder_name = request.data.get('folder_name')
        shipment = self.get_object()

        if not folder_name:
            return Response({"error": "Не указано имя папки"}, status=status.HTTP_400_BAD_REQUEST)

        folder = ShipmentFolder.objects.create(
            shipment=shipment, 
            name=folder_name,
            created_by=getattr(request.user, 'userprofile', None)
        )
        
        serializer = ShipmentFolderSerializer(folder)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'folders/(?P<folder_id>\d+)')
    def delete_folder(self, request, pk=None, folder_id=None):
        """Удаление папки и всех связанных файлов"""
        try:
            folder = ShipmentFolder.objects.get(id=folder_id, shipment_id=pk)
            folder_path = os.path.join(settings.MEDIA_ROOT, f'logistic/shipments/{folder.shipment.id}/{folder.name}')

            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)  # Удаление папки и всех файлов в ней

            # Удаление всех файлов, связанных с папкой, и самой папки из базы данных
            folder.files.all().delete()
            folder.delete()

            return Response({"message": "Папка и её содержимое удалены"}, status=status.HTTP_204_NO_CONTENT)
        except ShipmentFolder.DoesNotExist:
            return Response({"error": "Папка не найдена"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='files')
    def get_files(self, request, pk=None):
        """
        Получает список всех файлов и папок отправки.
        
        Файлы в папках включены в данные о каждой папке.
        Возвращает структурированное представление файлов:
        - files: файлы в корне
        - folders: папки с вложенными файлами
        - all_files: плоский список всех файлов (включая файлы в папках)
        """
        shipment = self.get_object()
        root_files = ShipmentFile.objects.filter(shipment=shipment, folder=None)
        folders = ShipmentFolder.objects.filter(shipment=shipment)
        all_files = ShipmentFile.objects.filter(shipment=shipment)

        file_serializer = ShipmentFileSerializer(root_files, many=True)
        folder_serializer = ShipmentFolderSerializer(folders, many=True)
        all_files_serializer = ShipmentFileSerializer(all_files, many=True)

        return Response({
            "files": file_serializer.data,
            "folders": folder_serializer.data,
            "all_files": all_files_serializer.data
        })

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Обновляет статус и комментарий отправления.
        Доступно для сотрудников склада, менеджеров и выше.
        """
        shipment = self.get_object()
        status_id = request.data.get('status')
        comment = request.data.get('comment')
        
        # Проверка наличия статуса
        if not status_id:
            return Response({'error': 'Необходимо указать ID статуса'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Получаем статус из базы данных
            shipment_status = ShipmentStatus.objects.get(id=status_id)
            
            # Обновляем поля отправления
            shipment.status = shipment_status
            
            if comment is not None:
                shipment.comment = comment
                
            shipment.save()
            
            # Возвращаем обновленное отправление
            serializer = ShipmentListSerializer(shipment) if self.action != 'retrieve' else ShipmentDetailSerializer(shipment)
            return Response(serializer.data)
            
        except ShipmentStatus.DoesNotExist:
            return Response({'error': 'Указанный статус не найден'}, 
                            status=status.HTTP_404_NOT_FOUND)


class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.all().order_by('-created_at')
    permission_classes = [IsCompanyManager, IsCompanyClient]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RequestDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            # Используем RequestSerializer для создания и обновления
            return RequestSerializer
        return RequestListSerializer
    
    def get_permissions(self):
        """
        Возвращает разные наборы разрешений в зависимости от действия.
        """
        # Разрешаем доступ к специальному методу update_status для склада
        if self.action == 'update_status':
            return [IsCompanyWarehouse()]
            
        # Для обычных действий используем стандартные разрешения
        return [IsCompanyManager(), IsCompanyClient()]
    
    def get_queryset(self):
        """
        Возвращает заявки в зависимости от роли пользователя.
        """
        user = self.request.user
        if user.is_superuser:
            return Request.objects.all()
        
        user_profile = user.userprofile
        if user_profile.user_group == 'admin':
            return Request.objects.filter(client__company=user_profile.company)
        elif user_profile.user_group == 'boss':
            return Request.objects.filter(client__company=user_profile.company)
        elif user_profile.user_group == 'manager':
            return Request.objects.filter(
                Q(client__company=user_profile.company) &
                (Q(manager=user_profile) | Q(manager__isnull=True))
            )
        elif user_profile.user_group == 'warehouse':
            return Request.objects.filter(
                Q(client__company=user_profile.company)
            )
        else:  # client
            return Request.objects.filter(client=user_profile)
    
    def perform_create(self, serializer):
        """
        При создании заявки устанавливает статус по умолчанию.
        """
        company = self.request.user.userprofile.company
        default_status = RequestStatus.objects.get(company=company, is_default=True)
        serializer.save(status=default_status, company=company)
        
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Обновляет статус, комментарий и фактические вес/объем заявки.
        Доступно для сотрудников склада, менеджеров и выше.
        """
        request_obj = self.get_object()
        
        # Отладочный вывод входящих данных
        print("Received data:", request.data)
        
        status_id = request.data.get('status')
        comment = request.data.get('comment')
        actual_weight = request.data.get('actual_weight')
        actual_volume = request.data.get('actual_volume')
        
        # Проверка наличия статуса
        if not status_id:
            return Response({'error': 'Необходимо указать ID статуса'}, 
                           status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Получаем статус из базы данных
            request_status = RequestStatus.objects.get(id=status_id)
            
            # Обновляем поля заявки
            request_obj.status = request_status
            
            if comment is not None:
                request_obj.comment = comment
                
            # Обновляем фактический вес и объем, если указаны
            if actual_weight is not None:
                request_obj.actual_weight = actual_weight
                
            if actual_volume is not None:
                request_obj.actual_volume = actual_volume
                
            request_obj.save()
            
            # После обновления, проверим, что данные были сохранены
            print("Updated request fields:", {
                'col_mest': request_obj.col_mest,
                'declared_weight': request_obj.declared_weight,
                'declared_volume': request_obj.declared_volume, 
                'actual_weight': request_obj.actual_weight,
                'actual_volume': request_obj.actual_volume,
            })
            
            # Используем RequestSerializer вместо RequestListSerializer
            serializer = RequestSerializer(request_obj)
            return Response(serializer.data)
            
        except RequestStatus.DoesNotExist:
            return Response({'error': 'Указанный статус не найден'}, 
                           status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def request_upload_files(self, request, pk=None):
        request_instance = self.get_object()
        files = request.FILES.getlist('files')

        if not files:
            return Response({"error": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Создаем папку с ID заявки, если её нет (для существующей заявки)
        target_dir = os.path.join(settings.MEDIA_ROOT, f'logistic/requests/{request_instance.id}')
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        created_files = []
        # Сохраняем файлы в нужную папку
        for file in files:
            file_path = os.path.join(target_dir, file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            file_obj = RequestFile.objects.create(
                request=request_instance, 
                file=file.name,
                uploaded_by=getattr(request.user, 'userprofile', None)
            )
            created_files.append(file_obj)

        serializer = RequestFileSerializer(created_files, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _move_tmp_files(self, request_instance):
        """ Перемещаем временные файлы в папку заявки после её создания. """
        tmp_dir = os.path.join(settings.MEDIA_ROOT, 'logistic/requests/tmp')
        target_dir = os.path.join(settings.MEDIA_ROOT, f'logistic/requests/{request_instance.id}')

        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        for file_instance in request_instance.files.all():
            tmp_path = os.path.join(tmp_dir, file_instance.file)
            target_path = os.path.join(target_dir, file_instance.file)
            if os.path.exists(tmp_path):
                os.rename(tmp_path, target_path)

    @action(detail=True, methods=['get'], url_path='download-all-files', url_name='download_all_files')
    def download_all_files(self, request, pk=None):
        """
        Скачивает все файлы заявки.
        
        Возвращает все файлы заявки для скачивания.
        """
        try:
            request_instance = self.get_object()
            response = request_instance.get_files_zip()
            response['Content-Disposition'] = f'attachment; filename="request_{request_instance.number}_files.zip"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path=r'download-file/(?P<file_id>\d+)', url_name='download_single_file')
    def download_single_file(self, request, pk=None, file_id=None):
        """
        Скачивает конкретный файл заявки.
        
        Возвращает конкретный файл заявки для скачивания.
        """
        try:
            file_instance = RequestFile.objects.get(id=file_id, request_id=pk)
            full_path = file_instance.get_file_path()

            if not os.path.exists(full_path):
                raise Http404("Файл не найден")

            response = FileResponse(open(full_path, 'rb'), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{file_instance.file}"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
        except RequestFile.DoesNotExist:
            raise Http404("Файл не найден")

    @action(detail=True, methods=['delete'], url_path=r'files/(?P<file_id>\d+)')
    def delete_file(self, request, pk=None, file_id=None):
        """ Удаление файла заявки. """
        try:
            file_instance = RequestFile.objects.get(id=file_id, request_id=pk)
            full_path = file_instance.get_file_path()

            if os.path.exists(full_path):
                os.remove(full_path)
                file_instance.delete()
                return Response({"message": "Файл успешно удален"}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"error": "Файл не найден"}, status=status.HTTP_404_NOT_FOUND)
        except RequestFile.DoesNotExist:
            return Response({"error": "Файл не найден"}, status=status.HTTP_404_NOT_FOUND)

    def perform_destroy(self, instance):
        """ Удаление заявки и её файлов. """
        folder_path = os.path.join(settings.MEDIA_ROOT, f'logistic/requests/{instance.id}')

        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)

        super().perform_destroy(instance)

    def list(self, request, *args, **kwargs):
        """
        Получение списка заявок с отладкой
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Отладочный вывод первой заявки, если она есть
        if queryset.exists():
            first_request = queryset.first()
            print("DEBUG - Первая заявка из базы данных:")
            print(f"ID: {first_request.id}")
            print(f"Количество мест: {first_request.col_mest}")
            print(f"Заявленный вес: {first_request.declared_weight}")
            print(f"Заявленный объем: {first_request.declared_volume}")
            print(f"Фактический вес: {first_request.actual_weight}")
            print(f"Фактический объем: {first_request.actual_volume}")
            print(f"Ставка: {first_request.rate}")
            print(f"Комментарий: {first_request.comment}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            
            # Отладочный вывод первого сериализованного объекта, если он есть
            if serializer.data:
                print("DEBUG - Первая заявка после сериализации:")
                first_item = serializer.data[0]
                print(f"ID: {first_item.get('id')}")
                print(f"Количество мест: {first_item.get('col_mest')}")
                print(f"Заявленный вес: {first_item.get('declared_weight')}")
                print(f"Заявленный объем: {first_item.get('declared_volume')}")
                print(f"Фактический вес: {first_item.get('actual_weight')}")
                print(f"Фактический объем: {first_item.get('actual_volume')}")
                print(f"Ставка: {first_item.get('rate')}")
                print(f"Комментарий: {first_item.get('comment')}")
                
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AnalyticsSummaryView(generics.GenericAPIView):
    serializer_class = AnalyticsSummarySerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        user = request.user
        user_profile = user.userprofile
        
        # Получаем данные по отправлениям
        shipments = Shipment.objects.filter(company=user_profile.company)
        total_shipments = shipments.count()
        shipments_by_status = shipments.values('status__code').annotate(count=Count('id'))
        
        # Получаем данные по заявкам
        requests = Request.objects.filter(company=user_profile.company)
        total_requests = requests.count()
        requests_by_status = requests.values('status__code').annotate(count=Count('id'))
        
        # Получаем финансовые данные
        finances = Finance.objects.filter(company=user_profile.company)
        total_revenue = finances.filter(operation_type='income').aggregate(total=Sum('amount'))['total'] or 0
        total_expenses = finances.filter(operation_type='expense').aggregate(total=Sum('amount'))['total'] or 0
        total_profit = total_revenue - total_expenses
        
        # Группируем по валютам
        revenue_by_currency = finances.filter(operation_type='income').values('currency').annotate(total=Sum('amount'))
        expenses_by_currency = finances.filter(operation_type='expense').values('currency').annotate(total=Sum('amount'))
        
        data = {
            'total_shipments': total_shipments,
            'total_requests': total_requests,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'total_profit': total_profit,
            'shipments_by_status': {item['status__code']: item['count'] for item in shipments_by_status},
            'requests_by_status': {item['status__code']: item['count'] for item in requests_by_status},
            'revenue_by_currency': {item['currency']: item['total'] for item in revenue_by_currency},
            'expenses_by_currency': {item['currency']: item['total'] for item in expenses_by_currency}
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class BalanceView(generics.GenericAPIView):
    serializer_class = BalanceSerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        if not hasattr(request.user, 'userprofile') or not request.user.userprofile.company:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        company = request.user.userprofile.company
        
        # Получаем суммы по входящим операциям (доходы)
        income = Finance.objects.filter(
            company=company,
            operation_type='in'
        ).values('currency').annotate(total=Sum('amount'))
        
        # Получаем суммы по исходящим операциям (расходы)
        expenses = Finance.objects.filter(
            company=company,
            operation_type='out'
        ).values('currency').annotate(total=Sum('amount'))
        
        # Форматируем результат
        result = {
            'income': {},
            'expenses': {},
            'balance': {}
        }
        
        # Заполняем доходы
        for item in income:
            currency = item['currency']
            result['income'][currency] = float(item['total'] or 0)
            result['balance'][currency] = float(item['total'] or 0)
        
        # Заполняем расходы и обновляем баланс
        for item in expenses:
            currency = item['currency']
            amount = float(item['total'] or 0)
            result['expenses'][currency] = amount
            
            if currency in result['balance']:
                result['balance'][currency] -= amount
            else:
                result['balance'][currency] = -amount
        
        serializer = self.get_serializer(data=result)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class CounterpartyBalanceView(generics.GenericAPIView):
    serializer_class = CounterpartyBalanceSerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        if not hasattr(request.user, 'userprofile') or not request.user.userprofile.company:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        company = request.user.userprofile.company
        
        # Получаем все операции по контрагентам
        operations = Finance.objects.filter(
            company=company,
            counterparty__isnull=False
        )
        
        counterparties = {}
        
        for op in operations:
            counterparty_id = op.counterparty.id
            counterparty_name = op.counterparty.get_full_name() or op.counterparty.username
            currency = op.currency
            amount = op.amount or 0
            
            if op.operation_type == 'out':
                amount = -amount
            
            if counterparty_id not in counterparties:
                counterparties[counterparty_id] = {
                    'id': counterparty_id,
                    'name': counterparty_name,
                    'balances': {}
                }
            
            if currency not in counterparties[counterparty_id]['balances']:
                counterparties[counterparty_id]['balances'][currency] = 0
                
            counterparties[counterparty_id]['balances'][currency] += amount
        
        # Преобразуем в список и форматируем суммы как float
        result = []
        for cp_id, data in counterparties.items():
            for currency in data['balances']:
                data['balances'][currency] = float(data['balances'][currency])
            result.append(data)
        
        serializer = self.get_serializer(data=result, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class EmailView(generics.GenericAPIView):
    serializer_class = EmailSerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            # Создаем MIME-сообщение
            msg = MIMEMultipart('alternative')
            msg['Subject'] = data['subject']
            msg['From'] = f"{data['sender_name']} <{data['sender_email']}>"
            msg['To'] = data['recipient_email']
            
            # Добавляем текстовое содержимое
            part1 = MIMEText(data['message_plain'], 'plain')
            msg.attach(part1)

            # Если есть HTML-содержимое, добавляем его
            if data['message_html']:
                part2 = MIMEText(data['message_html'], 'html')
                msg.attach(part2)

            # Создаем SMTP-соединение с TLS
            context = ssl.create_default_context(cafile=certifi.where())
            with smtplib.SMTP_SSL("smtp.example.com", 465, context=context) as server:
                server.login(data['sender_email'], 'password')  # В реальной жизни пароль должен быть в безопасном хранилище
                server.sendmail(data['sender_email'], data['recipient_email'], msg.as_string())

            return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            # Обработка ошибок отправки
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ArticleList(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsCompanyBoss]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            return Article.objects.filter(company=self.request.user.userprofile.company)
        return Article.objects.none()
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            serializer.save(company=self.request.user.userprofile.company)


class ArticleDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsCompanyBoss]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            return Article.objects.filter(company=self.request.user.userprofile.company)
        return Article.objects.none()


class FinanceList(generics.ListCreateAPIView):
    serializer_class = FinanceListSerializer
    permission_classes = [IsCompanyManager]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'userprofile'):
            user_profile = self.request.user.userprofile
            company = user_profile.company
            
            if not company:
                return Finance.objects.none()
            
            # Клиенты видят только свои финансы
            if user_profile.user_group == 'client':
                # Финансы по заявкам клиента
                client_requests = Request.objects.filter(client=user_profile)
                return Finance.objects.filter(company=company).filter(
                    request__in=client_requests
                ).distinct()
            
            # Остальные видят все финансы своей компании
            return Finance.objects.filter(company=company)
        
        return Finance.objects.none()
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            serializer.save(
                company=self.request.user.userprofile.company,
                created_by=self.request.user.userprofile
            )


class FinanceDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FinanceDetailSerializer
    permission_classes = [IsCompanyManager]
    lookup_field = 'number'

    def get_queryset(self):
        if hasattr(self.request.user, 'userprofile'):
            user_profile = self.request.user.userprofile
            company = user_profile.company
            
            if not company:
                return Finance.objects.none()
            
            # Клиенты видят только свои финансы
            if user_profile.user_group == 'client':
                # Финансы по заявкам клиента
                client_requests = Request.objects.filter(client=user_profile)
                return Finance.objects.filter(company=company).filter(
                    request__in=client_requests
                ).distinct()
            
            # Остальные видят все финансы своей компании
            return Finance.objects.filter(company=company)
        
        return Finance.objects.none()


class ShipmentCalculationViewSet(viewsets.ModelViewSet):
    queryset = ShipmentCalculation.objects.all()
    serializer_class = ShipmentCalculationSerializer
    permission_classes = [IsCompanyBoss]

    @action(detail=True, methods=['get'])
    def calculation_related_requests(self, request, pk=None):
        # Получить заявки, связанные с отправлением
        calculation = self.get_object()
        requests = Request.objects.filter(shipment=calculation.shipment)
        serializer = RequestListSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path=r'by-shipment/(?P<shipment_id>\d+)')
    def get_by_shipment(self, request, shipment_id=None):
        # Получить или создать расчет для отправления
        shipment = get_object_or_404(Shipment, id=shipment_id)
        calculation, created = ShipmentCalculation.objects.get_or_create(shipment=shipment)
        serializer = self.get_serializer(calculation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='calculate-costs')
    def calculate_costs(self, request, pk=None):
        """
        Расчет затрат на основе курсов валют и связанных заявок.
        """
        calculation = self.get_object()
        
        # Получаем параметры расчета
        data = request.data
        euro_rate = Decimal(str(data.get('euro_rate', calculation.euro_rate)))
        usd_rate = Decimal(str(data.get('usd_rate', calculation.usd_rate)))
        
        # Обновляем курсы
        calculation.euro_rate = euro_rate
        calculation.usd_rate = usd_rate
        calculation.save()
        
        # Получаем связанные заявки
        requests = Request.objects.filter(shipment=calculation.shipment)
        
        # Рассчитываем суммы в зависимости от валюты для каждой заявки
        result = {
            'requests': [],
            'totals': {
                'usd': Decimal('0.0'),
                'eur': Decimal('0.0'),
                'rub': Decimal('0.0')
            }
        }
        
        for req in requests:
            if not req.rate:
                continue
                
            try:
                rate_data = json.loads(req.rate)
            except:
                continue
                
            request_costs = {
                'id': req.id,
                'client': req.client.name if req.client and req.client.name else req.client.user.username,
                'number': req.number,
                'costs': []
            }
            
            for rate_item in rate_data:
                amount = Decimal(str(rate_item.get('amount', '0')))
                currency = rate_item.get('currency', 'rub')
                description = rate_item.get('description', '')
                
                # Переводим суммы в рубли
                if currency == 'usd':
                    rub_amount = amount * usd_rate
                    result['totals']['usd'] += amount
                elif currency == 'eur':
                    rub_amount = amount * euro_rate
                    result['totals']['eur'] += amount
                else:
                    rub_amount = amount
                    result['totals']['rub'] += amount
                
                # Округляем до двух знаков после запятой
                rub_amount = rub_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                
                request_costs['costs'].append({
                    'amount': float(amount),
                    'currency': currency,
                    'description': description,
                    'rub_amount': float(rub_amount)
                })
            
            if request_costs['costs']:
                result['requests'].append(request_costs)
        
        # Переводим итоговые суммы в числа с плавающей точкой для JSON
        result['totals']['usd'] = float(result['totals']['usd'])
        result['totals']['eur'] = float(result['totals']['eur'])
        result['totals']['rub'] = float(result['totals']['rub'])
        
        return Response(result)

    def update(self, request, *args, **kwargs):
        # Запрещаем изменение поля shipment при обновлении
        if 'shipment' in request.data:
            return Response({"error": "Cannot change shipment for existing calculation"},
                          status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'], url_path='expenses')
    def get_expenses(self, request, pk=None):
        """
        Получить финансовые операции (расходы) для отправления
        """
        calculation = self.get_object()
        expenses = Finance.objects.filter(
            shipment=calculation.shipment, 
            operation_type='out'
        )
        
        # Группируем расходы по валютам
        result = {
            'expenses': [],
            'totals': {
                'usd': Decimal('0'),
                'eur': Decimal('0'),
                'rub': Decimal('0'),
                'rubnds': Decimal('0'),
                'rubbn': Decimal('0')
            }
        }
        
        for expense in expenses:
            if expense.amount:
                # Добавляем сумму в итоги по валюте
                if expense.currency in result['totals']:
                    result['totals'][expense.currency] += expense.amount
                    
                result['expenses'].append({
                    'id': expense.number,
                    'amount': float(expense.amount),
                    'currency': expense.currency,
                    'payment_date': expense.payment_date.strftime('%Y-%m-%d'),
                    'description': expense.comment or '',
                    'is_paid': expense.is_paid
                })
        
        # Переводим в float для JSON
        for key in result['totals']:
            result['totals'][key] = float(result['totals'][key])
            
        return Response(result)


class RequestStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления статусами заявок.
    
    Обеспечивает стандартные CRUD-операции для модели RequestStatus.
    Доступ:
    - Чтение: все сотрудники компании (включая менеджеров, склад)
    - Создание/изменение/удаление: только администраторы
    """
    queryset = RequestStatus.objects.all().order_by('name')
    serializer_class = RequestStatusSerializer
    
    def get_permissions(self):
        """
        Возвращает разные наборы разрешений в зависимости от действия.
        """
        # Для чтения доступно всем сотрудникам компании (включая склад и менеджеров)
        if self.action in ['list', 'retrieve']:
            return [IsCompanyWarehouse()]
        
        # Для создания, изменения и удаления - только администраторы
        return [IsCompanyAdmin()]
    
    def get_queryset(self):
        """
        Возвращает только статусы, доступные в компании пользователя.
        """
        if self.request.user.is_superuser:
            return RequestStatus.objects.all().order_by('name')
        
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            return RequestStatus.objects.filter(
                company=self.request.user.userprofile.company
            ).order_by('name')
        
        return RequestStatus.objects.none()
