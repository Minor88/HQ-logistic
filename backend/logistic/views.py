from rest_framework import viewsets, status, generics
from .models import UserProfile, Shipment, Request, RequestFile, ShipmentFile, ShipmentFolder, Article, Finance, ShipmentCalculation, Company
from .serializers import UserProfileSerializer, ShipmentListSerializer, ShipmentDetailSerializer, RequestListSerializer, RequestDetailSerializer, RequestFileSerializer, ShipmentFileSerializer, ShipmentFolderSerializer, ArticleSerializer, FinanceListSerializer, FinanceDetailSerializer, ShipmentCalculationSerializer, CompanySerializer
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
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
from django.db.models import Sum
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
        """
        Переопределяет queryset в зависимости от роли пользователя.
        
        Клиенты видят только отправки, связанные с их заявками,
        остальные сотрудники видят все отправки своей компании.
        """
        # Фильтрация по компании пользователя
        if hasattr(self.request.user, 'userprofile') and self.request.user.userprofile.company:
            company = self.request.user.userprofile.company
            
            # Клиенты видят только отправки, связанные с их заявками
            if self.request.user.userprofile.user_group == 'client':
                client_requests = Request.objects.filter(client=self.request.user.userprofile)
                return Shipment.objects.filter(request__in=client_requests, company=company).distinct()
            
            # Остальные видят все отправки своей компании
            return Shipment.objects.filter(company=company)
        
        # Суперпользователи видят все
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            return Shipment.objects.all()
            
        return Shipment.objects.none()
    
    def perform_create(self, serializer):
        """
        Автоматически заполняет поля company и created_by при создании отправки.
        """
        # Добавляем компанию и создателя при создании
        company = None
        if hasattr(self.request.user, 'userprofile'):
            company = self.request.user.userprofile.company
        
        serializer.save(
            company=company,
            created_by=getattr(self.request.user, 'userprofile', None)
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

    @action(detail=True, methods=['get'], url_path=r'download_file/(?P<file_id>\d+)')
    def download_file(self, request, pk=None, file_id=None):
        """
        Скачивает файл отправки.
        
        Возвращает файл как вложение для скачивания.
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

    @action(detail=True, methods=['post'], url_path='create_folder')
    def create_folder(self, request, pk=None):
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
        # Фильтрация по компании пользователя
        if hasattr(self.request.user, 'userprofile'):
            user_profile = self.request.user.userprofile
            company = user_profile.company
            
            if not company:
                return Request.objects.none()
            
            # Клиенты видят только свои заявки
            if user_profile.user_group == 'client':
                return Request.objects.filter(client=user_profile, company=company)
            
            # Остальные видят все заявки своей компании
            return Request.objects.filter(company=company)
        
        # Суперпользователи видят все
        if self.request.user.is_superuser or (hasattr(self.request.user, 'userprofile') and 
                                             self.request.user.userprofile.user_group == 'superuser'):
            return Request.objects.all()
            
        return Request.objects.none()
    
    def perform_create(self, serializer):
        # Добавляем компанию и менеджера при создании
        company = None
        manager = None
        
        if hasattr(self.request.user, 'userprofile'):
            company = self.request.user.userprofile.company
            
            # Если запрос создает не клиент, то создатель становится менеджером
            if self.request.user.userprofile.user_group != 'client':
                manager = self.request.user.userprofile
        
        request_instance = serializer.save(company=company, manager=manager)
        
        # Если есть временные файлы, перемещаем их в папку заявки
        self._move_tmp_files(request_instance)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_files(self, request, pk=None):
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

    @action(detail=True, methods=['get'], url_path=r'download_file/(?P<file_id>\d+)')
    def download_file(self, request, pk=None, file_id=None):
        """ Скачивание файлов заявки. """
        try:
            file_instance = RequestFile.objects.get(id=file_id, request_id=pk)
            full_path = file_instance.get_file_path()

            if not os.path.exists(full_path):
                raise Http404("Файл не найден")

        except RequestFile.DoesNotExist:
            raise Http404("Файл не найден")

        response = FileResponse(open(full_path, 'rb'), as_attachment=True)

        # Корректная обработка имени файла
        response['Content-Disposition'] = f'attachment; filename="{file_instance.file}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response

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


@api_view(['POST'])
def send_email(request):
    """
    Отправка электронной почты с поддержкой HTML и текстового содержимого.
    """
    sender_email = request.data.get('sender_email')
    sender_name = request.data.get('sender_name', 'Логистическая компания')
    recipient_email = request.data.get('recipient_email')
    subject = request.data.get('subject', 'Уведомление от логистической компании')
    message_plain = request.data.get('message_plain', '')
    message_html = request.data.get('message_html', '')

    if not sender_email or not recipient_email:
        return Response({"error": "Не указаны обязательные поля: sender_email, recipient_email"},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        # Создаем MIME-сообщение
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{sender_name} <{sender_email}>"
        msg['To'] = recipient_email

        # Добавляем текстовое содержимое
        part1 = MIMEText(message_plain, 'plain')
        msg.attach(part1)

        # Если есть HTML-содержимое, добавляем его
        if message_html:
            part2 = MIMEText(message_html, 'html')
            msg.attach(part2)

        # Создаем SMTP-соединение с TLS
        context = ssl.create_default_context(cafile=certifi.where())
        with smtplib.SMTP_SSL("smtp.example.com", 465, context=context) as server:
            server.login(sender_email, 'password')  # В реальной жизни пароль должен быть в безопасном хранилище
            server.sendmail(sender_email, recipient_email, msg.as_string())

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
    def related_requests(self, request, pk=None):
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


@api_view(['GET'])
def get_balance(request):
    """
    Получить общий баланс по всем финансовым операциям компании
    """
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
    
    return Response(result)


@api_view(['GET'])
def counterparty_balance(request):
    """
    Получить баланс по контрагентам
    """
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
    
    return Response(result)


@api_view(['GET'])
def analytics_summary(request):
    """
    Возвращает сводную аналитику по компании.
    
    Включает:
    - Количество активных отправок и заявок
    - Финансовую сводку
    - Статистику по статусам
    
    Требует аутентификации и привязки к компании.
    """
    if not hasattr(request.user, 'userprofile') or not request.user.userprofile.company:
        return Response({"error": "Unauthorized or no company assigned"}, status=status.HTTP_401_UNAUTHORIZED)
    
    company = request.user.userprofile.company
    
    # Определяем временные рамки для анализа
    today = datetime.date.today()
    month_start = today.replace(day=1)
    
    # Статистика по отправкам
    shipments_total = Shipment.objects.filter(company=company).count()
    shipments_active = Shipment.objects.filter(
        company=company, 
        status__in=['at_warehouse', 'document_preparation', 'departed', 
                    'border_crossing', 'customs_clearance', 'on_way_to_customs', 
                    'on_way_to_warehouse', 'at_unloading_warehouse']
    ).count()
    shipments_completed = Shipment.objects.filter(company=company, status='done').count()
    shipments_this_month = Shipment.objects.filter(
        company=company, 
        created_at__gte=month_start
    ).count()
    
    # Статистика по заявкам
    requests_total = Request.objects.filter(company=company).count()
    requests_active = Request.objects.filter(
        company=company,
        status__in=['new', 'expected', 'on_warehouse', 'in_progress', 'ready']
    ).count()
    requests_completed = Request.objects.filter(company=company, status='delivered').count()
    requests_this_month = Request.objects.filter(
        company=company,
        created_at__gte=month_start
    ).count()
    
    # Финансовая статистика
    income_this_month = Finance.objects.filter(
        company=company,
        operation_type='in',
        payment_date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    expenses_this_month = Finance.objects.filter(
        company=company,
        operation_type='out',
        payment_date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Статистика по статусам отправок
    shipment_status_stats = {}
    for status_code, status_name in dict(Shipment.SHIPMENT_STATUS_CHOICES).items():
        count = Shipment.objects.filter(company=company, status=status_code).count()
        shipment_status_stats[status_code] = {
            'name': status_name,
            'count': count
        }
    
    # Статистика по статусам заявок
    request_status_stats = {}
    for status_code, status_name in dict(Request.REQUEST_STATUS_CHOICES).items():
        count = Request.objects.filter(company=company, status=status_code).count()
        request_status_stats[status_code] = {
            'name': status_name,
            'count': count
        }
    
    # Формируем итоговый результат
    result = {
        'company': {
            'id': company.id,
            'name': company.name
        },
        'shipments': {
            'total': shipments_total,
            'active': shipments_active,
            'completed': shipments_completed,
            'this_month': shipments_this_month,
            'status_stats': shipment_status_stats
        },
        'requests': {
            'total': requests_total,
            'active': requests_active,
            'completed': requests_completed,
            'this_month': requests_this_month,
            'status_stats': request_status_stats
        },
        'finance': {
            'this_month': {
                'income': float(income_this_month),
                'expenses': float(expenses_this_month),
                'profit': float(income_this_month - expenses_this_month)
            }
        },
        'timestamp': datetime.datetime.now().isoformat()
    }
    
    return Response(result)
