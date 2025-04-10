# Документация по бэкенду HQ-logistic

## Оглавление
1. [Обзор](#обзор)
2. [Структура проекта](#структура-проекта)
3. [Модели данных](#модели-данных)
4. [Аутентификация и права доступа](#аутентификация-и-права-доступа)
5. [API Endpoints](#api-endpoints)
6. [Работа с файлами](#работа-с-файлами)
7. [Установка и настройка](#установка-и-настройка)
8. [Примеры использования API](#примеры-использования-api)

## Обзор

Бэкенд HQ-logistic реализован на Django и Django REST Framework. Проект представляет собой API для логистической платформы, обеспечивающей:
- Управление логистическими компаниями
- Учет пользователей с разными ролями
- Работу с отправками и заявками
- Управление файлами (документами)
- Финансовый учет
- Различные расчеты по отправкам

## Структура проекта

```
backend/
├── backend/             # Основной проект Django
│   ├── settings.py      # Настройки проекта
│   ├── urls.py          # Основные URL маршруты
│   └── ...
├── logistic/            # Приложение для логистической платформы
│   ├── models.py        # Модели данных
│   ├── views.py         # Представления API
│   ├── serializers.py   # Сериализаторы для API
│   ├── permissions.py   # Классы разрешений
│   ├── urls.py          # URL маршруты API
│   └── admin.py         # Настройки админ-панели
└── ...
```

## Модели данных

### Company (Компания)
Основная сущность, представляющая логистическую компанию.
- `name`: Название компании
- `address`: Адрес компании
- `phone`: Телефон
- `email`: Email
- `created_at`: Дата создания

### UserProfile (Профиль пользователя)
Расширение стандартной модели пользователя Django с дополнительными полями.
- `user`: Связь с моделью User Django
- `company`: Связь с компанией
- `phone`: Телефон
- `name`: Имя
- `comment`: Комментарий
- `user_group`: Группа пользователя (суперпользователь, администратор, руководитель, менеджер, склад, клиент)
- `is_active`: Активен ли пользователь

### Shipment (Отправка)
Представляет отправку сборного груза.
- `number`: Номер отправки
- `company`: Компания, которой принадлежит отправка
- `status`: Статус отправки
- `comment`: Комментарий
- `created_at`: Дата создания
- `created_by`: Создатель

### Request (Заявка)
Представляет заявку на перевозку груза.
- `number`: Номер заявки
- `company`: Компания
- `description`: Описание
- `warehouse_number`: Номер на складе
- `col_mest`: Количество мест
- `declared_weight`: Заявленный вес
- `declared_volume`: Заявленный объем
- `actual_weight`: Фактический вес
- `actual_volume`: Фактический объем
- `rate`: Ставка (хранится в JSON)
- `comment`: Комментарий
- `status`: Статус заявки
- `client`: Клиент (связь с UserProfile)
- `manager`: Менеджер (связь с UserProfile)
- `shipment`: Связь с отправкой
- `created_at`: Дата создания

### RequestFile и ShipmentFile
Модели для хранения файлов заявок и отправок.

### Finance (Финансы)
Учет финансовых операций.
- `number`: Номер операции
- `company`: Компания
- `operation_type`: Тип операции (входящий/исходящий)
- `payment_date`: Дата оплаты
- `document_type`: Тип документа (счет/оплата)
- `currency`: Валюта (рубль, безнал, НДС, евро, доллар)
- `counterparty`: Контрагент
- `article`: Статья расхода/дохода
- `amount`: Сумма
- `shipment`: Связь с отправкой
- `request`: Связь с заявкой
- `basis`: Основание (связь с другой финансовой операцией)
- `is_paid`: Оплачен ли
- `created_by`: Создатель

## Аутентификация и права доступа

Система использует JWT-токены для аутентификации (через Simple JWT) и Djoser для управления пользователями.

### Иерархия пользователей

1. **Суперпользователи** - самый высший уровень, имеют доступ ко всем данным
2. **Администраторы** - руководители компаний-заказчиков
3. **Руководители** - пользователи Администраторов с высшими правами
4. **Менеджеры** - сотрудники с базовыми правами
5. **Склад** - сотрудники склада с ограниченными правами
6. **Клиент** - пользователи, которые видят только свои данные

### Классы разрешений

- `IsSuperuser` - права суперпользователя
- `IsCompanyAdmin` - права администратора компании
- `IsCompanyBoss` - права руководителя
- `IsCompanyManager` - права менеджера
- `IsCompanyWarehouse` - права складского работника
- `IsCompanyClient` - права клиента
- `IsOwnerOrReadOnly` - владелец объекта или только чтение
- `IsCompanyMember` - любой член компании

## API Endpoints

### Аутентификация
- `POST /api/token/` - получение JWT-токена
- `POST /api/token/refresh/` - обновление JWT-токена
- `POST /api/auth/users/` - регистрация нового пользователя (через Djoser)
- `POST /api/auth/token/login/` - вход (через Djoser)
- `POST /api/auth/token/logout/` - выход (через Djoser)

### Компании
- `GET /api/companies/` - список всех компаний (для суперпользователей)
- `POST /api/companies/` - создание новой компании
- `GET /api/companies/{id}/` - детали компании
- `PUT /api/companies/{id}/` - обновление компании
- `DELETE /api/companies/{id}/` - удаление компании

### Пользователи
- `GET /api/userprofiles/` - список пользователей
- `POST /api/userprofiles/` - создание пользователя
- `GET /api/userprofiles/{id}/` - детали пользователя
- `PUT /api/userprofiles/{id}/` - обновление пользователя
- `DELETE /api/userprofiles/{id}/` - удаление пользователя
- `GET /api/clients/` - список клиентов

### Отправки
- `GET /api/shipments/` - список отправок
- `POST /api/shipments/` - создание отправки
- `GET /api/shipments/{id}/` - детали отправки
- `PUT /api/shipments/{id}/` - обновление отправки
- `DELETE /api/shipments/{id}/` - удаление отправки
- `POST /api/shipments/{id}/create-folder/` - создание папки в отправке
- `POST /api/shipments/{id}/upload-files/` - загрузка файлов
- `GET /api/shipments/{id}/download-file/{file_id}/` - скачивание файла
- `DELETE /api/shipments/{id}/files/{file_id}/` - удаление файла
- `DELETE /api/shipments/{id}/folders/{folder_id}/` - удаление папки
- `GET /api/shipments/{id}/files/` - получение файлов и папок отправки

### Заявки
- `GET /api/requests/` - список заявок
- `POST /api/requests/` - создание заявки
- `GET /api/requests/{id}/` - детали заявки
- `PUT /api/requests/{id}/` - обновление заявки
- `DELETE /api/requests/{id}/` - удаление заявки
- `POST /api/requests/{id}/upload-files/` - загрузка файлов
- `GET /api/requests/{id}/download-file/{file_id}/` - скачивание файла
- `DELETE /api/requests/{id}/files/{file_id}/` - удаление файла

### Расчеты отправок
- `GET /api/shipment-calculations/` - список расчетов
- `POST /api/shipment-calculations/` - создание расчета
- `GET /api/shipment-calculations/{id}/` - детали расчета
- `PUT /api/shipment-calculations/{id}/` - обновление расчета
- `DELETE /api/shipment-calculations/{id}/` - удаление расчета
- `POST /api/shipment-calculations/{id}/calculate-costs/` - расчет затрат
- `GET /api/shipment-calculations/{id}/expenses/` - получение расходов
- `GET /api/shipment-calculations/{id}/related-requests/` - получение связанных заявок
- `GET /api/shipment-calculations/by-shipment/{shipment_id}/` - получение расчета по ID отправки

### Статьи расходов/доходов
- `GET /api/articles/` - список статей
- `POST /api/articles/` - создание статьи
- `GET /api/articles/{id}/` - детали статьи
- `PUT /api/articles/{id}/` - обновление статьи
- `DELETE /api/articles/{id}/` - удаление статьи

### Финансы
- `GET /api/finance/` - список финансовых операций
- `POST /api/finance/` - создание финансовой операции
- `GET /api/finance/{number}/` - детали финансовой операции
- `PUT /api/finance/{number}/` - обновление финансовой операции
- `DELETE /api/finance/{number}/` - удаление финансовой операции
- `GET /api/finance/balance/` - получение баланса
- `GET /api/finance/counterparty-balance/` - получение баланса по контрагентам

### Аналитика
- `GET /api/analytics/summary/` - получение сводной аналитики по компании (статистика по отправкам, заявкам, финансам)

### Прочие
- `POST /api/send-email/` - отправка email

## Работа с файлами

Файлы хранятся в файловой системе в следующей структуре:
- `media/logistic/requests/{request_id}/` - файлы заявок
- `media/logistic/shipments/{shipment_id}/` - файлы отправок
- `media/logistic/shipments/{shipment_id}/{folder_name}/` - файлы в папках отправок

При загрузке файла в систему, информация о нем сохраняется в базе данных (модели RequestFile или ShipmentFile), а сам файл сохраняется в соответствующей директории.

## Установка и настройка

### Требования
- Python 3.8+
- Django 5.1+
- PostgreSQL
- Supabase (для хранения данных)

### Шаги установки

1. Клонировать репозиторий
```
git clone https://github.com/Minor88/HQ-logistic.git
cd HQ-logistic/backend
```

2. Создать и активировать виртуальное окружение
```
python -m venv venv
source venv/bin/activate  # для Linux/Mac
venv\Scripts\activate  # для Windows
```

3. Установить зависимости
```
pip install -r requirements.txt
```

4. Создать файл .env в корне проекта со следующими параметрами:
```
DATABASE_URL=postgres://user:password@host:port/database
SECRET_KEY=your-secret-key
DEBUG=True
```

5. Применить миграции
```
python manage.py migrate
```

6. Создать суперпользователя
```
python manage.py createsuperuser
```

7. Запустить сервер
```
python manage.py runserver
```

8. Перейти в админ-панель Django по адресу http://localhost:8000/admin/ для управления данными

### Подключение к Supabase

Для подключения к Supabase необходимо:
1. Создать проект в Supabase
2. Получить URL и API ключ
3. Настроить переменную DATABASE_URL в файле .env
4. Настроить CORS в Supabase для доступа с вашего домена

## Примеры использования API

В этом разделе приведены конкретные примеры запросов и ответов API для облегчения разработки фронтенда. 

### Аутентификация

#### Получение JWT токена

**Запрос:**
```http
POST /api/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Ответ:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Обновление JWT токена

**Запрос:**
```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ответ:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Получение данных текущего пользователя

**Запрос:**
```http
GET /api/auth/users/me/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "groups": ["admin"]
}
```

### Компании

#### Получение списка компаний

**Запрос:**
```http
GET /api/companies/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Логистик Групп",
      "address": "г. Москва, ул. Ленина, 10",
      "phone": "+7 (495) 123-45-67",
      "email": "info@logistic-group.ru",
      "created_at": "2023-05-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "ТрансКарго",
      "address": "г. Санкт-Петербург, ул. Невская, 5",
      "phone": "+7 (812) 765-43-21",
      "email": "info@transcargo.ru",
      "created_at": "2023-05-02T11:00:00Z"
    }
  ]
}
```

#### Создание компании

**Запрос:**
```http
POST /api/companies/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Новая компания",
  "address": "г. Казань, ул. Кремлевская, 1",
  "phone": "+7 (843) 123-45-67",
  "email": "info@newcompany.ru"
}
```

**Ответ:**
```json
{
  "id": 3,
  "name": "Новая компания",
  "address": "г. Казань, ул. Кремлевская, 1",
  "phone": "+7 (843) 123-45-67",
  "email": "info@newcompany.ru",
  "created_at": "2023-05-10T14:30:00Z"
}
```

### Пользователи

#### Получение списка пользователей

**Запрос:**
```http
GET /api/userprofiles/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "company": 1,
      "phone": "+7 (999) 123-45-67",
      "name": "Иванов Иван",
      "comment": "Руководитель",
      "user_group": "boss",
      "is_active": true
    },
    {
      "id": 2,
      "user": 2,
      "company": 1,
      "phone": "+7 (999) 234-56-78",
      "name": "Петров Петр",
      "comment": "Менеджер по продажам",
      "user_group": "manager",
      "is_active": true
    },
    {
      "id": 3,
      "user": 3,
      "company": 2,
      "phone": "+7 (999) 345-67-89",
      "name": "Сидоров Сидор",
      "comment": "Клиент",
      "user_group": "client",
      "is_active": true
    }
  ]
}
```

#### Создание пользователя

**Запрос:**
```http
POST /api/userprofiles/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "user": {
    "username": "new_user",
    "password": "secure_password",
    "email": "new_user@example.com"
  },
  "company": 1,
  "phone": "+7 (999) 987-65-43",
  "name": "Новый Пользователь",
  "comment": "Работник склада",
  "user_group": "warehouse"
}
```

**Ответ:**
```json
{
  "id": 4,
  "user": 4,
  "company": 1,
  "phone": "+7 (999) 987-65-43",
  "name": "Новый Пользователь",
  "comment": "Работник склада",
  "user_group": "warehouse",
  "is_active": true
}
```

### Отправки

#### Получение списка отправок

**Запрос:**
```http
GET /api/shipments/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "SHP-001",
      "company": 1,
      "status": "at_warehouse",
      "comment": "Формируется на складе в Москве",
      "created_at": "2023-05-05T09:30:00Z",
      "created_by": 1,
      "files": [
        {
          "id": 1,
          "file": "/media/logistic/shipments/1/document.pdf",
          "name": "Документы по отправке",
          "folder": null,
          "uploaded_at": "2023-05-05T10:00:00Z"
        }
      ]
    },
    {
      "id": 2,
      "number": "SHP-002",
      "company": 1,
      "status": "departed",
      "comment": "Выехал со склада 10.05.2023",
      "created_at": "2023-05-10T08:00:00Z",
      "created_by": 1,
      "files": []
    }
  ]
}
```

#### Создание отправки

**Запрос:**
```http
POST /api/shipments/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "number": "SHP-003",
  "status": "at_warehouse",
  "comment": "Новая отправка"
}
```

**Ответ:**
```json
{
  "id": 3,
  "number": "SHP-003",
  "company": 1,
  "status": "at_warehouse",
  "comment": "Новая отправка",
  "created_at": "2023-05-15T14:00:00Z",
  "created_by": 1,
  "files": []
}
```

#### Загрузка файлов для отправки

**Запрос:**
```http
POST /api/shipments/3/upload-files/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

files: [file1.pdf, file2.pdf]
folder: "Документы"
```

**Ответ:**
```json
{
  "message": "Файлы успешно загружены",
  "files": [
    {
      "id": 2,
      "file": "/media/logistic/shipments/3/Документы/file1.pdf",
      "name": "file1.pdf",
      "folder": "Документы",
      "uploaded_at": "2023-05-15T14:15:00Z"
    },
    {
      "id": 3,
      "file": "/media/logistic/shipments/3/Документы/file2.pdf",
      "name": "file2.pdf",
      "folder": "Документы",
      "uploaded_at": "2023-05-15T14:15:00Z"
    }
  ]
}
```

### Заявки

#### Получение списка заявок

**Запрос:**
```http
GET /api/requests/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "REQ-001",
      "company": 1,
      "description": "Перевозка оборудования",
      "warehouse_number": "WH-001",
      "col_mest": 5,
      "declared_weight": 500.0,
      "declared_volume": 2.5,
      "actual_weight": 510.0,
      "actual_volume": 2.6,
      "rate": {
        "base": 10000,
        "additional": 2000
      },
      "comment": "Хрупкий груз",
      "status": "on_warehouse",
      "client": 3,
      "manager": 2,
      "shipment": 1,
      "created_at": "2023-05-06T11:00:00Z",
      "files": [
        {
          "id": 1,
          "file": "/media/logistic/requests/1/invoice.pdf",
          "name": "Счет",
          "uploaded_at": "2023-05-06T11:30:00Z"
        }
      ]
    },
    {
      "id": 2,
      "number": "REQ-002",
      "company": 1,
      "description": "Доставка мебели",
      "warehouse_number": "WH-002",
      "col_mest": 3,
      "declared_weight": 300.0,
      "declared_volume": 1.8,
      "actual_weight": 320.0,
      "actual_volume": 1.9,
      "rate": {
        "base": 8000,
        "additional": 1500
      },
      "comment": "Требуется аккуратная разгрузка",
      "status": "new",
      "client": 3,
      "manager": null,
      "shipment": null,
      "created_at": "2023-05-12T10:30:00Z",
      "files": []
    }
  ]
}
```

#### Создание заявки

**Запрос:**
```http
POST /api/requests/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "description": "Перевозка бытовой техники",
  "col_mest": 2,
  "declared_weight": 200.0,
  "declared_volume": 1.0,
  "comment": "Два холодильника",
  "status": "new",
  "client": 3
}
```

**Ответ:**
```json
{
  "id": 3,
  "number": "REQ-003",
  "company": 1,
  "description": "Перевозка бытовой техники",
  "warehouse_number": null,
  "col_mest": 2,
  "declared_weight": 200.0,
  "declared_volume": 1.0,
  "actual_weight": null,
  "actual_volume": null,
  "rate": null,
  "comment": "Два холодильника",
  "status": "new",
  "client": 3,
  "manager": null,
  "shipment": null,
  "created_at": "2023-05-20T09:15:00Z",
  "files": []
}
```

#### Загрузка файлов для заявки

**Запрос:**
```http
POST /api/requests/3/upload-files/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

files: [invoice.pdf, packing_list.pdf]
```

**Ответ:**
```json
{
  "message": "Файлы успешно загружены",
  "files": [
    {
      "id": 2,
      "file": "/media/logistic/requests/3/invoice.pdf",
      "name": "invoice.pdf",
      "uploaded_at": "2023-05-20T09:30:00Z"
    },
    {
      "id": 3,
      "file": "/media/logistic/requests/3/packing_list.pdf",
      "name": "packing_list.pdf",
      "uploaded_at": "2023-05-20T09:30:00Z"
    }
  ]
}
```

#### Получение файлов заявки

**Запрос:**
```http
GET /api/requests/3/files/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
[
  {
    "id": 2,
    "file": "/media/logistic/requests/3/invoice.pdf",
    "name": "invoice.pdf",
    "uploaded_at": "2023-05-20T09:30:00Z"
  },
  {
    "id": 3,
    "file": "/media/logistic/requests/3/packing_list.pdf",
    "name": "packing_list.pdf",
    "uploaded_at": "2023-05-20T09:30:00Z"
  }
]
```

#### Скачивание файла заявки

**Запрос:**
```http
GET /api/requests/3/download-file/2/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
Файл возвращается в формате binary с соответствующими заголовками:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice.pdf"
```

#### Удаление файла заявки

**Запрос:**
```http
DELETE /api/requests/3/files/2/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Файл успешно удален"
}
```

### Финансы

#### Получение списка финансовых операций

**Запрос:**
```http
GET /api/finance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "FIN-001",
      "company": 1,
      "operation_type": "incoming",
      "payment_date": "2023-05-15",
      "document_type": "invoice",
      "currency": "rub",
      "counterparty": "ООО Клиент",
      "article": 1,
      "amount": 10000.0,
      "shipment": 1,
      "request": 1,
      "basis": null,
      "is_paid": false,
      "created_by": 1,
      "created_at": "2023-05-10T15:00:00Z"
    },
    {
      "id": 2,
      "number": "FIN-002",
      "company": 1,
      "operation_type": "outgoing",
      "payment_date": "2023-05-18",
      "document_type": "payment",
      "currency": "rub",
      "counterparty": "ООО Перевозчик",
      "article": 2,
      "amount": 5000.0,
      "shipment": 1,
      "request": null,
      "basis": null,
      "is_paid": true,
      "created_by": 1,
      "created_at": "2023-05-18T10:00:00Z"
    }
  ]
}
```

#### Получение баланса

**Запрос:**
```http
GET /api/finance/balance/?currency=rub
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "balance": {
    "rub": 5000.0
  }
}
```

### Расчеты отправок

#### Получение расчета по ID отправки

**Запрос:**
```http
GET /api/shipment-calculations/by-shipment/1/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "shipment": 1,
  "company": 1,
  "total_weight": 510.0,
  "total_volume": 2.6,
  "total_cost": 12000.0,
  "expenses": [
    {
      "id": 1,
      "article": 2,
      "amount": 5000.0,
      "currency": "rub",
      "description": "Оплата перевозчику",
      "created_at": "2023-05-18T10:00:00Z"
    }
  ],
  "created_at": "2023-05-10T15:30:00Z",
  "updated_at": "2023-05-18T10:15:00Z"
}
```

#### Расчет затрат

**Запрос:**
```http
POST /api/shipment-calculations/1/calculate-costs/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "weight_cost": 100,
  "volume_cost": 1000,
  "additional_costs": 2000
}
```

**Ответ:**
```json
{
  "weight_cost_total": 51000.0,
  "volume_cost_total": 2600.0,
  "additional_costs": 2000.0,
  "total_cost": 55600.0
}
```

### Статьи расходов/доходов

#### Получение списка статей

**Запрос:**
```http
GET /api/articles/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Оплата от клиента",
    "type": "income",
    "company": 1,
    "created_at": "2023-05-01T12:00:00Z"
  },
  {
    "id": 2,
    "name": "Оплата перевозчику",
    "type": "expense",
    "company": 1,
    "created_at": "2023-05-01T12:30:00Z"
  },
  {
    "id": 3,
    "name": "Таможенные сборы",
    "type": "expense",
    "company": 1,
    "created_at": "2023-05-01T13:00:00Z"
  }
]
```

### Аналитика

#### Получение сводной аналитики

**Запрос:**
```http
GET /api/analytics/summary/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "shipments": {
    "total": 2,
    "by_status": {
      "at_warehouse": 1,
      "departed": 1
    }
  },
  "requests": {
    "total": 3,
    "by_status": {
      "new": 2,
      "on_warehouse": 1
    }
  },
  "finances": {
    "income": {
      "rub": 10000.0
    },
    "expense": {
      "rub": 5000.0
    },
    "balance": {
      "rub": 5000.0
    }
  },
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
``` 