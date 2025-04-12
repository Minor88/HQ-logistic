from rest_framework import viewsets, status, generics
from .models import UserProfile, Shipment, Request, RequestFile, ShipmentFile, ShipmentFolder, Article, Finance, ShipmentCalculation, Company, ShipmentStatus, RequestStatus
from .serializers import UserProfileSerializer, ShipmentListSerializer, ShipmentDetailSerializer, RequestListSerializer, RequestDetailSerializer, RequestFileSerializer, ShipmentFileSerializer, ShipmentFolderSerializer, ArticleSerializer, FinanceListSerializer, FinanceDetailSerializer, ShipmentCalculationSerializer, CompanySerializer, ShipmentStatusSerializer, RequestStatusSerializer, AnalyticsSummarySerializer, BalanceSerializer, CounterpartyBalanceSerializer, EmailSerializer
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


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления компаниями.
    
    Обеспечивает стандартные CRUD-операции для модели Company.
    Доступен только для суперпользователей и администраторов компаний.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsSuperuser | IsCompanyAdmin]
    
    def get_queryset(self):
        """
        Переопределяет queryset в зависимости от роли пользователя.
        
        Суперпользователи видят все компании, администраторы - только свою.
        """
        # Суперпользователи видят все компании
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            return Company.objects.all()
        
        # Администраторы видят только свою компанию
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            return Company.objects.filter(id=self.request.user.userprofile.company.id)
        
        return Company.objects.none()

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


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления профилями пользователей.
    
    Обеспечивает стандартные CRUD-операции для модели UserProfile.
    Доступен только для администраторов и руководителей компаний.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsCompanyAdmin | IsCompanyBoss]
    
    def get_queryset(self):
        """
        Переопределяет queryset в зависимости от роли пользователя.
        
        Суперпользователи видят всех пользователей, администраторы и руководители - 
        только пользователей своей компании.
        """
        # Суперпользователи видят всех пользователей
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            return UserProfile.objects.all()
        
        # Администраторы и руководители видят только пользователей своей компании
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
        # Получаем всех клиентов на основе поля user_group
        queryset = self.get_queryset().filter(user_group='client', is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ShipmentStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления статусами отправок.
    Доступен только администраторам компании.
    """
    serializer_class = ShipmentStatusSerializer
    permission_classes = [IsCompanyAdmin]
    queryset = ShipmentStatus.objects.all()

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
    Доступен для менеджеров компаний и выше.
    """
    queryset = Shipment.objects.all().order_by('-created_at')
    permission_classes = [IsCompanyManager]
    
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
            # Проверяем существование статусов
            warehouse_status = ShipmentStatus.objects.filter(
                company=company,
                code='at_warehouse'
            ).first()
            doc_status = ShipmentStatus.objects.filter(
                company=company,
                code='document_preparation'
            ).first()
            
            if not warehouse_status or not doc_status:
                # Если статусы не существуют, создаем их
                self._create_default_statuses(company)
                warehouse_status = ShipmentStatus.objects.get(
                    company=company,
                    code='at_warehouse'
                )
                doc_status = ShipmentStatus.objects.get(
                    company=company,
                    code='document_preparation'
                )
            
            return Shipment.objects.filter(
                company=company,
                status__in=[warehouse_status, doc_status]
            )
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
        folder_id = request.data.get('folder_id')  # Получаем folder_id из запроса

        if not files:
            return Response({"error": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Если folder_id не null, получаем папку; иначе оставляем folder как None для корня
        folder = None
        if folder_id:
            folder = ShipmentFolder.objects.get(id=folder_id)

        # Определяем путь для хранения файлов
        folder_path = os.path.join(
            settings.MEDIA_ROOT, 
            f'logistic/shipments/{shipment_instance.id}/{folder.name if folder else ""}'
        )

        # Создаем папку, если она не существует
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
            files = ShipmentFile.objects.filter(shipment=shipment_instance)
            response = FileResponse(shipment_instance.get_files_zip(), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{shipment_instance.name}_files.zip"'
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
        shipment = self.get_object()
        files = ShipmentFile.objects.filter(shipment=shipment, folder=None)
        folders = ShipmentFolder.objects.filter(shipment=shipment)

        file_serializer = ShipmentFileSerializer(files, many=True)
        folder_serializer = ShipmentFolderSerializer(folders, many=True)

        return Response({
            "files": file_serializer.data,
            "folders": folder_serializer.data
        })


class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.all().order_by('-created_at')
    permission_classes = [IsCompanyManager | IsCompanyClient]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RequestDetailSerializer
        return RequestListSerializer
    
    def get_queryset(self):
        """
        Возвращает заявки в зависимости от роли пользователя.
        """
        user = self.request.user
        if user.is_superuser:
            return Request.objects.all()
        
        user_profile = user.userprofile
        if user_profile.role == 'admin':
            return Request.objects.filter(client__company=user_profile.company)
        elif user_profile.role == 'boss':
            return Request.objects.filter(client__company=user_profile.company)
        elif user_profile.role == 'manager':
            return Request.objects.filter(
                Q(client__company=user_profile.company) &
                (Q(manager=user_profile) | Q(manager__isnull=True))
            )
        elif user_profile.role == 'warehouse':
            return Request.objects.filter(
                Q(client__company=user_profile.company) &
                Q(status__code__in=['on_warehouse', 'ready'])
            )
        else:  # client
            return Request.objects.filter(client=user_profile)
    
    def perform_create(self, serializer):
        """
        При создании заявки устанавливает статус по умолчанию.
        """
        company = self.request.user.userprofile.company
        default_status = RequestStatus.objects.get(company=company, is_default=True)
        serializer.save(status=default_status)

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
            files = RequestFile.objects.filter(request=request_instance)
            response = request_instance.get_files_zip()
            response['Content-Disposition'] = f'attachment; filename="{request_instance.name}_files.zip"'
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
    Доступен только администраторам компании.
    """
    serializer_class = RequestStatusSerializer
    permission_classes = [IsCompanyAdmin]
    queryset = RequestStatus.objects.all()

    def get_queryset(self):
        """
        Возвращает только статусы компании пользователя.
        """
        return RequestStatus.objects.filter(company=self.request.user.userprofile.company)

    def perform_create(self, serializer):
        """
        При создании статуса автоматически устанавливает компанию пользователя.
        """
        serializer.save(company=self.request.user.userprofile.company)
