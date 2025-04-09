from django.contrib.auth.models import User
from django.db import models
import os
from django.utils import timezone
from django.conf import settings
import shutil

# Модель логистической компании
class Company(models.Model):
    """
    Модель логистической компании.
    Основная сущность, которая содержит данные о компании-заказчике.
    Все сущности в системе (пользователи, отправки, заявки и т.д.) привязаны к компании.
    """
    name = models.CharField(max_length=255, verbose_name='Название компании')
    address = models.TextField(blank=True, null=True, verbose_name='Адрес')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Компания'
        verbose_name_plural = 'Компании'

# Кастомная модель пользователя
class UserProfile(models.Model):
    """
    Модель профиля пользователя.
    Расширяет стандартную модель User Django дополнительными полями.
    Содержит информацию о роли пользователя в системе, его компании и контактные данные.
    """
    USER_GROUP_CHOICES = [
        ('superuser', 'Суперпользователь'),  # Сотрудники компании разработчика
        ('admin', 'Администратор'),  # Руководитель логистической компании
        ('boss', 'Руководитель'),  # Руководитель подразделения
        ('manager', 'Менеджер'),  # Менеджер
        ('warehouse', 'Склад'),  # Сотрудник склада
        ('client', 'Клиент'),  # Клиент
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Компания')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Имя')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    user_group = models.CharField(max_length=50, choices=USER_GROUP_CHOICES, verbose_name='Группа пользователя')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    
    def __str__(self):
        return f"{self.name or self.user.username} ({self.get_user_group_display()})"
    
    class Meta:
        verbose_name = 'Профиль пользователя'
        verbose_name_plural = 'Профили пользователей'
        permissions = [
            ("view_own_company_data", "Может просматривать данные своей компании"),
            ("edit_own_company_data", "Может редактировать данные своей компании"),
        ]

# Модель отправки
class Shipment(models.Model):
    """
    Модель отправки (фуры).
    Представляет собой отправку сборного груза, которая содержит несколько заявок.
    Имеет статус, который отражает текущее состояние отправки.
    """
    SHIPMENT_STATUS_CHOICES = [
        ('at_warehouse', 'Формируется на складе'),
        ('document_preparation', 'Подготовка документов'),
        ('departed', 'Вышел со склада'),
        ('border_crossing', 'Прохождение границы'),
        ('customs_clearance', 'Таможенная очистка'),
        ('on_way_to_customs', 'В пути на таможню'),
        ('on_way_to_warehouse', 'В пути на склад выгрузки'),
        ('at_unloading_warehouse', 'На складе выгрузки'),
        ('done', 'Завершен'),
    ]
    number = models.CharField(max_length=50, verbose_name='Номер')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name='Компания')
    status = models.CharField(max_length=50, choices=SHIPMENT_STATUS_CHOICES, default='at_warehouse', verbose_name='Статус')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    created_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='created_shipments', verbose_name='Создал')
    
    def __str__(self):
        return f"Отправка #{self.number} ({self.get_status_display()})"
    
    class Meta:
        verbose_name = 'Отправка'
        verbose_name_plural = 'Отправки'
        ordering = ['-created_at']

    def delete(self, *args, **kwargs):
        """
        Переопределенный метод удаления.
        При удалении отправки также удаляет директорию с файлами отправки на сервере.
        """
        # Удаляем директорию с файлами на сервере
        folder_path = os.path.join(settings.MEDIA_ROOT, 'logistic', 'shipments', str(self.id))
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)

        # Удаляем объект из базы данных
        super().delete(*args, **kwargs)

# Модель заявки
def request_directory_path(instance, filename):
    """
    Функция для определения пути к файлу заявки в файловой системе.
    Если заявка ещё не создана, файл сохраняется во временной папке.
    После создания заявки файл будет перемещен в папку с ID заявки.
    """
    # Если заявка не создана (id ещё нет), файлы будут временно сохраняться в 'logistic/requests/tmp'
    if not instance.pk:
        return f'logistic/requests/tmp/{filename}'
    # Если заявка создана, файл сохраняется в папке с ID заявки
    return f'logistic/requests/{instance.pk}/{filename}'

class Request(models.Model):
    """
    Модель заявки на перевозку груза.
    Представляет собой заявку клиента на перевозку груза.
    Содержит информацию о грузе, его параметрах, статусе и связи с отправкой.
    """
    REQUEST_STATUS_CHOICES = [
        ('new', 'Новая заявка'),
        ('expected', 'Ожидается на складе'),
        ('on_warehouse', 'Формируется'),
        ('in_progress', 'В работе'),
        ('ready', 'Готово к выдаче'),
        ('delivered', 'Выдано'),
    ]
    number = models.IntegerField(null=True, blank=True, verbose_name='Номер')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name='Компания')
    description = models.TextField(null=True, blank=True, verbose_name='Описание')
    warehouse_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Номер на складе')
    col_mest = models.FloatField(null=True, blank=True, verbose_name='Количество мест')
    declared_weight = models.FloatField(null=True, blank=True, verbose_name='Заявленный вес')
    declared_volume = models.FloatField(null=True, blank=True, verbose_name='Заявленный объем')
    actual_weight = models.FloatField(null=True, blank=True, verbose_name='Фактический вес')
    actual_volume = models.FloatField(null=True, blank=True, verbose_name='Фактический объем')
    rate = models.TextField(null=True, blank=True, verbose_name='Ставка')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='new', verbose_name='Статус')
    client = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='client_requests', verbose_name='Клиент')
    manager = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='manager_requests', verbose_name='Менеджер')
    shipment = models.ForeignKey(Shipment, null=True, blank=True, on_delete=models.SET_NULL, verbose_name='Отправка')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    
    def __str__(self):
        return f"Заявка #{self.number or 'Новая'} ({self.get_status_display()})"
    
    class Meta:
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'
        ordering = ['-created_at']

class RequestFile(models.Model):
    """
    Модель файла заявки.
    Хранит информацию о файле, привязанном к конкретной заявке.
    """
    request = models.ForeignKey(Request, related_name='files', on_delete=models.CASCADE, verbose_name='Заявка')
    file = models.CharField(max_length=255, verbose_name='Файл')  # Храним только имя файла
    uploaded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, verbose_name='Загрузил')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')

    def get_file_path(self):
        """
        Метод для получения полного пути к файлу.
        Используется для доступа к файлу на сервере.
        """
        # Динамическое построение полного пути к файлу
        return os.path.join(settings.MEDIA_ROOT, f'logistic/requests/{self.request.id}/{self.file}')
    
    class Meta:
        verbose_name = 'Файл заявки'
        verbose_name_plural = 'Файлы заявок'

class ShipmentFolder(models.Model):
    """
    Модель папки отправки.
    Представляет собой папку, в которой хранятся файлы отправки.
    """
    shipment = models.ForeignKey(Shipment, related_name='folders', on_delete=models.CASCADE, verbose_name='Отправка')
    name = models.CharField(max_length=255, verbose_name='Название папки')  # Название папки
    created_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, verbose_name='Создал')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    def __str__(self):
        return f"Папка {self.name} (Отправка #{self.shipment.number})"

    def save(self, *args, **kwargs):
        """
        Переопределенный метод сохранения.
        При сохранении папки создает соответствующую директорию в файловой системе.
        """
        # Сначала сохраняем объект в базе данных
        super().save(*args, **kwargs)

        # Путь к папке, которую нужно создать
        folder_path = os.path.join(settings.MEDIA_ROOT, f'logistic/shipments/{self.shipment.id}/{self.name}')

        # Проверяем, существует ли уже папка, и создаем ее, если не существует
        os.makedirs(folder_path, exist_ok=True)
    
    class Meta:
        verbose_name = 'Папка отправки'
        verbose_name_plural = 'Папки отправок'

class ShipmentFile(models.Model):
    """
    Модель файла отправки.
    Хранит информацию о файле, привязанном к отправке.
    Файл может быть размещен в корне или в папке.
    """
    shipment = models.ForeignKey(Shipment, related_name='files', on_delete=models.CASCADE, verbose_name='Отправка')
    file = models.CharField(max_length=255, verbose_name='Файл')
    folder = models.ForeignKey(ShipmentFolder, null=True, blank=True, related_name='files', on_delete=models.CASCADE, verbose_name='Папка')
    uploaded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, verbose_name='Загрузил')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')

    def get_file_path(self):
        """
        Метод для получения полного пути к файлу.
        Если файл находится в папке, учитывает путь к папке.
        """
        if self.folder:
            return os.path.join(settings.MEDIA_ROOT, f'logistic/shipments/{self.shipment.id}/{self.folder.name}/{self.file}')
        return os.path.join(settings.MEDIA_ROOT, f'logistic/shipments/{self.shipment.id}/{self.file}')
    
    class Meta:
        verbose_name = 'Файл отправки'
        verbose_name_plural = 'Файлы отправок'

class Article(models.Model):
    """
    Модель статьи расходов/доходов.
    Используется для категоризации финансовых операций.
    """
    name = models.CharField(max_length=255, verbose_name='Наименование статьи')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name='Компания')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Статья'
        verbose_name_plural = 'Статьи'
        unique_together = [['name', 'company']]

class Finance(models.Model):
    """
    Модель финансовой операции.
    Представляет собой финансовую операцию (доход или расход).
    Может быть привязана к отправке, заявке или другой финансовой операции.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    number = models.AutoField(primary_key=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name='Компания')
    operation_type = models.CharField(max_length=10, choices=[('in', 'Входящий'), ('out', 'Исходящий')], verbose_name='Тип операции')
    payment_date = models.DateField(verbose_name='Дата оплаты')
    document_type = models.CharField(max_length=10, choices=[('bill', 'Счёт'), ('payment', 'Оплата')], verbose_name='Тип документа')
    currency = models.CharField(max_length=10, choices=[('rub', 'Рубль'), ('rubbn', 'Безнал'), ('rubnds', 'НДС'), ('eur', 'Евро'), ('usd', 'Доллар')], verbose_name='Валюта')
    counterparty = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Контрагент')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Статья')
    comment = models.TextField(null=True, blank=True, verbose_name='Комментарий')
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Сумма')
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Отправление')
    request = models.ForeignKey(Request, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Заявка')
    basis = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name='Основание')
    is_paid = models.BooleanField(default=False, verbose_name="Оплачен")
    created_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='created_finances', verbose_name='Создал')
    
    def __str__(self):
        return f"Финансовая операция #{self.number} ({self.get_operation_type_display()})"
    
    class Meta:
        verbose_name = 'Финансовая операция'
        verbose_name_plural = 'Финансовые операции'
        ordering = ['-created_at']

class ShipmentCalculation(models.Model):
    """
    Модель расчета стоимости отправки.
    Хранит курсы валют, используемые для расчета стоимости отправки.
    """
    shipment = models.OneToOneField(Shipment, on_delete=models.CASCADE, related_name='calculation', verbose_name='Отправка')
    euro_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name='Курс Евро')
    usd_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name='Курс Доллара')
    
    def __str__(self):
        return f"Расчет для отправки #{self.shipment.number}"
    
    class Meta:
        verbose_name = 'Расчет отправки'
        verbose_name_plural = 'Расчеты отправок'