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
    },
    "by_period": {
      "today": 1,
      "week": 2,
      "month": 2
    }
  },
  "requests": {
    "total": 3,
    "by_status": {
      "new": 2,
      "on_warehouse": 1
    },
    "by_period": {
      "today": 1,
      "week": 2,
      "month": 3
    }
  },
  "finances": {
    "income": {
      "rub": 10000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "expense": {
      "rub": 5000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "balance": {
      "rub": 5000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "by_period": {
      "today": {
        "income": {
          "rub": 5000.0
        },
        "expense": {
          "rub": 2000.0
        }
      },
      "week": {
        "income": {
          "rub": 8000.0
        },
        "expense": {
          "rub": 4000.0
        }
      },
      "month": {
        "income": {
          "rub": 10000.0
        },
        "expense": {
          "rub": 5000.0
        }
      }
    }
  },
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение аналитики по отправкам

**Запрос:**
```http
GET /api/analytics/shipments/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "total": 2,
  "by_status": {
    "at_warehouse": 1,
    "departed": 1
  },
  "by_period": {
    "today": 1,
    "week": 2,
    "month": 2
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "total": 2,
      "by_status": {
        "at_warehouse": 1,
        "departed": 1
      }
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение аналитики по заявкам

**Запрос:**
```http
GET /api/analytics/requests/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "total": 3,
  "by_status": {
    "new": 2,
    "on_warehouse": 1
  },
  "by_period": {
    "today": 1,
    "week": 2,
    "month": 3
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "total": 3,
      "by_status": {
        "new": 2,
        "on_warehouse": 1
      }
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение финансовой аналитики

**Запрос:**
```http
GET /api/analytics/finance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "income": {
    "rub": 10000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "expense": {
    "rub": 5000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "balance": {
    "rub": 5000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "by_period": {
    "today": {
      "income": {
        "rub": 5000.0
      },
      "expense": {
        "rub": 2000.0
      }
    },
    "week": {
      "income": {
        "rub": 8000.0
      },
      "expense": {
        "rub": 4000.0
      }
    },
    "month": {
      "income": {
        "rub": 10000.0
      },
      "expense": {
        "rub": 5000.0
      }
    }
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "income": {
        "rub": 10000.0
      },
      "expense": {
        "rub": 5000.0
      },
      "balance": {
        "rub": 5000.0
      }
    }
  ],
  "by_article": [
    {
      "article": 1,
      "name": "Оплата перевозчику",
      "amount": 5000.0,
      "type": "expense"
    },
    {
      "article": 2,
      "name": "Оплата от клиента",
      "amount": 10000.0,
      "type": "income"
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

### Прочие
- `POST /api/send-email/` - отправка email

## Работа с файлами

Файлы хранятся в файловой системе в следующей структуре:
- `media/logistic/requests/{request_id}/` - файлы заявок
- `media/logistic/shipments/{shipment_id}/` - файлы отправок
- `media/logistic/shipments/{shipment_id}/{folder_name}/` - файлы в папках отправок

При загрузке файла в систему, информация о нем сохраняется в базе данных (модели RequestFile или ShipmentFile), а сам файл сохраняется в соответствующей директории.

### Загрузка файлов в отправку

**Запрос:**
```http
POST /api/shipments/{id}/upload-files/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

files: [file1.pdf, file2.pdf]
folder: "Документы"  # опционально
```

**Ответ:**
```json
{
  "message": "Файлы успешно загружены",
  "files": [
    {
      "id": 1,
      "file": "/media/logistic/shipments/1/Документы/file1.pdf",
      "name": "file1.pdf",
      "folder": "Документы",
      "uploaded_at": "2023-05-15T14:15:00Z"
    },
    {
      "id": 2,
      "file": "/media/logistic/shipments/1/Документы/file2.pdf",
      "name": "file2.pdf",
      "folder": "Документы",
      "uploaded_at": "2023-05-15T14:15:00Z"
    }
  ]
}
```

#### Создание папки в отправке

**Запрос:**
```http
POST /api/shipments/{id}/create-folder/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Новая папка"
}
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Новая папка",
  "shipment": 1,
  "created_by": 1,
  "created_at": "2023-05-15T14:20:00Z"
}
```

#### Получение списка файлов и папок отправки

**Запрос:**
```http
GET /api/shipments/{id}/files/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Документы",
      "created_at": "2023-05-15T14:15:00Z"
    }
  ],
  "files": [
    {
      "id": 1,
      "file": "/media/logistic/shipments/1/Документы/file1.pdf",
      "name": "file1.pdf",
      "folder": "Документы",
      "uploaded_at": "2023-05-15T14:15:00Z"
    }
  ]
}
```

#### Скачивание файла отправки

**Запрос:**
```http
GET /api/shipments/{id}/download-file/{file_id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
Файл возвращается в формате binary с соответствующими заголовками:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="file1.pdf"
```

#### Удаление файла отправки

**Запрос:**
```http
DELETE /api/shipments/{id}/files/{file_id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Файл успешно удален"
}
```

#### Удаление папки отправки

**Запрос:**
```http
DELETE /api/shipments/{id}/folders/{folder_id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Папка успешно удалена"
}
```

### Расчеты отправок

#### Создание расчета

**Запрос:**
```http
POST /api/shipment-calculations/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "shipment": 1,
  "euro_rate": 95.5,
  "usd_rate": 85.2
}
```

**Ответ:**
```json
{
  "id": 1,
  "shipment": 1,
  "euro_rate": 95.5,
  "usd_rate": 85.2,
  "created_at": "2023-05-15T15:00:00Z"
}
```

#### Получение расчета

**Запрос:**
```http
GET /api/shipment-calculations/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "shipment": 1,
  "euro_rate": 95.5,
  "usd_rate": 85.2,
  "created_at": "2023-05-15T15:00:00Z"
}
```

#### Обновление расчета

**Запрос:**
```http
PUT /api/shipment-calculations/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "euro_rate": 96.0,
  "usd_rate": 85.5
}
```

**Ответ:**
```json
{
  "id": 1,
  "shipment": 1,
  "euro_rate": 96.0,
  "usd_rate": 85.5,
  "created_at": "2023-05-15T15:00:00Z"
}
```

#### Удаление расчета

**Запрос:**
```http
DELETE /api/shipment-calculations/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Расчет успешно удален"
}
```

#### Получение связанных заявок

**Запрос:**
```http
GET /api/shipment-calculations/{id}/related-requests/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "requests": [
    {
      "id": 1,
      "number": "REQ-001",
      "description": "Перевозка оборудования",
      "declared_weight": 500.0,
      "declared_volume": 2.5,
      "actual_weight": 510.0,
      "actual_volume": 2.6,
      "rate": {
        "base": 10000,
        "additional": 2000
      }
    }
  ]
}
```

#### Получение расходов

**Запрос:**
```http
GET /api/shipment-calculations/{id}/expenses/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "expenses": [
    {
      "id": 1,
      "article": 2,
      "amount": 5000.0,
      "currency": "rub",
      "description": "Оплата перевозчику",
      "created_at": "2023-05-18T10:00:00Z"
    }
  ]
}
```

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

### Аутентификация и пользователи

#### Регистрация нового пользователя

**Запрос:**
```http
POST /api/auth/users/
Content-Type: application/json

{
  "username": "new_user",
  "password": "secure_password",
  "email": "new_user@example.com",
  "company": 1,
  "phone": "+7 (999) 123-45-67",
  "name": "Новый Пользователь",
  "comment": "Менеджер по продажам",
  "user_group": "manager"
}
```

**Ответ:**
```json
{
  "id": 1,
  "username": "new_user",
  "email": "new_user@example.com",
  "company": 1,
  "phone": "+7 (999) 123-45-67",
  "name": "Новый Пользователь",
  "comment": "Менеджер по продажам",
  "user_group": "manager",
  "is_active": true
}
```

#### Вход в систему

**Запрос:**
```http
POST /api/auth/token/login/
Content-Type: application/json

{
  "username": "new_user",
  "password": "secure_password"
}
```

**Ответ:**
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Выход из системы

**Запрос:**
```http
POST /api/auth/token/logout/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Успешный выход из системы"
}
```

#### Получение данных текущего пользователя

**Запрос:**
```http
GET /api/auth/users/me/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "username": "new_user",
  "email": "new_user@example.com",
  "company": 1,
  "phone": "+7 (999) 123-45-67",
  "name": "Новый Пользователь",
  "comment": "Менеджер по продажам",
  "user_group": "manager",
  "is_active": true
}
```

#### Получение профиля текущего пользователя

**Запрос:**
```http
GET /api/userprofiles/me/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "username": "new_user",
  "email": "new_user@example.com",
  "company": 1,
  "phone": "+7 (999) 987-65-43",
  "name": "Новый Пользователь (обновлено)",
  "comment": "Старший менеджер по продажам",
  "user_group": "manager",
  "is_active": true
}
```

#### Обновление данных пользователя (администратором)

**Запрос:**
```http
PUT /api/userprofiles/{id}/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "user_group": "boss",
  "is_active": true
}
```

**Ответ:**
```json
{
  "id": 1,
  "username": "new_user",
  "email": "new_user@example.com",
  "company": 1,
  "phone": "+7 (999) 987-65-43",
  "name": "Новый Пользователь (обновлено)",
  "comment": "Старший менеджер по продажам",
  "user_group": "boss",
  "is_active": true
}
```

#### Удаление пользователя

**Запрос:**
```http
DELETE /api/userprofiles/{id}/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Пользователь успешно удален"
}
```

#### Получение списка клиентов

**Запрос:**
```http
GET /api/clients/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
      "username": "client",
      "email": "client@example.com",
      "company": 1,
      "phone": "+7 (999) 333-44-55",
      "name": "Клиент",
      "comment": "Постоянный клиент",
      "user_group": "client",
      "is_active": true
    }
  ]
}
```

### Компании

#### Получение списка компаний

**Запрос:**
```http
GET /api/companies/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

#### Получение данных компании

**Запрос:**
```http
GET /api/companies/{id}/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Логистик Групп",
  "address": "г. Москва, ул. Ленина, 10",
  "phone": "+7 (495) 123-45-67",
  "email": "info@logistic-group.ru",
  "created_at": "2023-05-01T10:00:00Z"
}
```

#### Обновление данных компании

**Запрос:**
```http
PUT /api/companies/{id}/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Логистик Групп (обновлено)",
  "address": "г. Москва, ул. Ленина, 15",
  "phone": "+7 (495) 123-45-68",
  "email": "info@logistic-group.ru"
}
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Логистик Групп (обновлено)",
  "address": "г. Москва, ул. Ленина, 15",
  "phone": "+7 (495) 123-45-68",
  "email": "info@logistic-group.ru",
  "created_at": "2023-05-01T10:00:00Z"
}
```

#### Удаление компании

**Запрос:**
```http
DELETE /api/companies/{id}/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Компания успешно удалена"
}
```

#### Получение списка пользователей компании

**Запрос:**
```http
GET /api/companies/{id}/users/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
      "username": "new_user",
      "email": "new_user@example.com",
      "phone": "+7 (999) 987-65-43",
      "name": "Новый Пользователь (обновлено)",
      "comment": "Старший менеджер по продажам",
      "user_group": "manager",
      "is_active": true
    },
    {
      "id": 2,
      "username": "admin",
      "email": "admin@example.com",
      "phone": "+7 (999) 111-22-33",
      "name": "Администратор",
      "comment": "Руководитель отдела",
      "user_group": "admin",
      "is_active": true
    }
  ]
}
```

#### Получение списка грузов компании

**Запрос:**
```http
GET /api/companies/{id}/shipments/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "SH-2023-001",
      "status": "in_progress",
      "created_at": "2023-05-01T10:00:00Z",
      "updated_at": "2023-05-02T11:00:00Z"
    }
  ]
}
```

#### Получение списка заявок компании

**Запрос:**
```http
GET /api/companies/{id}/requests/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "RQ-2023-001",
      "status": "pending",
      "created_at": "2023-05-01T10:00:00Z",
      "updated_at": "2023-05-02T11:00:00Z"
    }
  ]
}
```

#### Получение финансовой статистики компании

**Запрос:**
```http
GET /api/companies/{id}/finance/
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "income": {
    "RUB": 1000000.00,
    "USD": 15000.00,
    "EUR": 12000.00
  },
  "expenses": {
    "RUB": 800000.00,
    "USD": 10000.00,
    "EUR": 8000.00
  },
  "balance": {
    "RUB": 200000.00,
    "USD": 5000.00,
    "EUR": 4000.00
  }
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

#### Создание статьи

**Запрос:**
```http
POST /api/articles/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Оплата перевозчику",
  "type": "expense",
  "company": 1
}
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Оплата перевозчику",
  "type": "expense",
  "company": 1,
  "created_at": "2023-05-15T16:00:00Z"
}
```

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
    "name": "Оплата перевозчику",
    "type": "expense",
    "company": 1,
    "created_at": "2023-05-15T16:00:00Z"
  },
  {
    "id": 2,
    "name": "Оплата от клиента",
    "type": "income",
    "company": 1,
    "created_at": "2023-05-15T16:30:00Z"
  }
]
```

#### Обновление статьи

**Запрос:**
```http
PUT /api/articles/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Оплата перевозчику (обновлено)",
  "type": "expense"
}
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Оплата перевозчику (обновлено)",
  "type": "expense",
  "company": 1,
  "created_at": "2023-05-15T16:00:00Z"
}
```

#### Удаление статьи

**Запрос:**
```http
DELETE /api/articles/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Статья успешно удалена"
}
```

### Финансы

#### Создание финансовой операции

**Запрос:**
```http
POST /api/finance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "company": 1,
  "operation_type": "out",
  "payment_date": "2023-05-15",
  "document_type": "payment",
  "currency": "rub",
  "counterparty": 1,
  "article": 1,
  "amount": 5000.0,
  "shipment": 1,
  "request": 1,
  "comment": "Оплата перевозчику"
}
```

**Ответ:**
```json
{
  "number": "FIN-001",
  "company": 1,
  "operation_type": "out",
  "payment_date": "2023-05-15",
  "document_type": "payment",
  "currency": "rub",
  "counterparty": 1,
  "article": 1,
  "amount": 5000.0,
  "shipment": 1,
  "request": 1,
  "comment": "Оплата перевозчику",
  "is_paid": false,
  "created_by": 1,
  "created_at": "2023-05-15T17:00:00Z"
}
```

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
      "number": "FIN-001",
      "company": 1,
      "operation_type": "out",
      "payment_date": "2023-05-15",
      "document_type": "payment",
      "currency": "rub",
      "counterparty": 1,
      "article": 1,
      "amount": 5000.0,
      "shipment": 1,
      "request": 1,
      "comment": "Оплата перевозчику",
      "is_paid": false,
      "created_by": 1,
      "created_at": "2023-05-15T17:00:00Z"
    },
    {
      "number": "FIN-002",
      "company": 1,
      "operation_type": "in",
      "payment_date": "2023-05-16",
      "document_type": "bill",
      "currency": "rub",
      "counterparty": 2,
      "article": 2,
      "amount": 10000.0,
      "shipment": 1,
      "request": 1,
      "comment": "Оплата от клиента",
      "is_paid": true,
      "created_by": 1,
      "created_at": "2023-05-16T10:00:00Z"
    }
  ]
}
```

#### Обновление финансовой операции

**Запрос:**
```http
PUT /api/finance/{number}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "is_paid": true,
  "comment": "Оплата перевозчику (обновлено)"
}
```

**Ответ:**
```json
{
  "number": "FIN-001",
  "company": 1,
  "operation_type": "out",
  "payment_date": "2023-05-15",
  "document_type": "payment",
  "currency": "rub",
  "counterparty": 1,
  "article": 1,
  "amount": 5000.0,
  "shipment": 1,
  "request": 1,
  "comment": "Оплата перевозчику (обновлено)",
  "is_paid": true,
  "created_by": 1,
  "created_at": "2023-05-15T17:00:00Z"
}
```

#### Удаление финансовой операции

**Запрос:**
```http
DELETE /api/finance/{number}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Финансовая операция успешно удалена"
}
```

#### Получение баланса

**Запрос:**
```http
GET /api/finance/balance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "balance": {
    "rub": 5000.0,
    "eur": 1000.0,
    "usd": 2000.0
  }
}
```

#### Получение баланса по контрагентам

**Запрос:**
```http
GET /api/finance/counterparty-balance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "counterparties": [
    {
      "id": 1,
      "name": "ООО Перевозчик",
      "balance": {
        "rub": -5000.0,
        "eur": 0.0,
        "usd": 0.0
      }
    },
    {
      "id": 2,
      "name": "ООО Клиент",
      "balance": {
        "rub": 10000.0,
        "eur": 0.0,
        "usd": 0.0
      }
    }
  ]
}
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
    },
    "by_period": {
      "today": 1,
      "week": 2,
      "month": 2
    }
  },
  "requests": {
    "total": 3,
    "by_status": {
      "new": 2,
      "on_warehouse": 1
    },
    "by_period": {
      "today": 1,
      "week": 2,
      "month": 3
    }
  },
  "finances": {
    "income": {
      "rub": 10000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "expense": {
      "rub": 5000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "balance": {
      "rub": 5000.0,
      "eur": 0.0,
      "usd": 0.0
    },
    "by_period": {
      "today": {
        "income": {
          "rub": 5000.0
        },
        "expense": {
          "rub": 2000.0
        }
      },
      "week": {
        "income": {
          "rub": 8000.0
        },
        "expense": {
          "rub": 4000.0
        }
      },
      "month": {
        "income": {
          "rub": 10000.0
        },
        "expense": {
          "rub": 5000.0
        }
      }
    }
  },
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение аналитики по отправкам

**Запрос:**
```http
GET /api/analytics/shipments/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "total": 2,
  "by_status": {
    "at_warehouse": 1,
    "departed": 1
  },
  "by_period": {
    "today": 1,
    "week": 2,
    "month": 2
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "total": 2,
      "by_status": {
        "at_warehouse": 1,
        "departed": 1
      }
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение аналитики по заявкам

**Запрос:**
```http
GET /api/analytics/requests/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "total": 3,
  "by_status": {
    "new": 2,
    "on_warehouse": 1
  },
  "by_period": {
    "today": 1,
    "week": 2,
    "month": 3
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "total": 3,
      "by_status": {
        "new": 2,
        "on_warehouse": 1
      }
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

#### Получение финансовой аналитики

**Запрос:**
```http
GET /api/analytics/finance/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "income": {
    "rub": 10000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "expense": {
    "rub": 5000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "balance": {
    "rub": 5000.0,
    "eur": 0.0,
    "usd": 0.0
  },
  "by_period": {
    "today": {
      "income": {
        "rub": 5000.0
      },
      "expense": {
        "rub": 2000.0
      }
    },
    "week": {
      "income": {
        "rub": 8000.0
      },
      "expense": {
        "rub": 4000.0
      }
    },
    "month": {
      "income": {
        "rub": 10000.0
      },
      "expense": {
        "rub": 5000.0
      }
    }
  },
  "by_company": [
    {
      "company": 1,
      "name": "Логистик Групп",
      "income": {
        "rub": 10000.0
      },
      "expense": {
        "rub": 5000.0
      },
      "balance": {
        "rub": 5000.0
      }
    }
  ],
  "by_article": [
    {
      "article": 1,
      "name": "Оплата перевозчику",
      "amount": 5000.0,
      "type": "expense"
    },
    {
      "article": 2,
      "name": "Оплата от клиента",
      "amount": 10000.0,
      "type": "income"
    }
  ],
  "period": {
    "start": "2023-05-01",
    "end": "2023-05-31"
  }
}
```

### Email-уведомления

#### Отправка email

**Запрос:**
```http
POST /api/send-email/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "to": ["user@example.com"],
  "subject": "Уведомление о статусе отправки",
  "message": "Ваша отправка #SHP-001 изменила статус на 'В пути'",
  "template": "shipment_status_change",  # опционально
  "context": {  # опционально, если используется шаблон
    "shipment_number": "SHP-001",
    "status": "В пути",
    "company_name": "Логистик Групп"
  }
}
```

**Ответ:**
```json
{
  "message": "Email успешно отправлен",
  "recipients": ["user@example.com"]
}
```

#### Получение истории отправленных email

**Запрос:**
```http
GET /api/email-history/
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
      "to": ["user@example.com"],
      "subject": "Уведомление о статусе отправки",
      "message": "Ваша отправка #SHP-001 изменила статус на 'В пути'",
      "template": "shipment_status_change",
      "context": {
        "shipment_number": "SHP-001",
        "status": "В пути",
        "company_name": "Логистик Групп"
      },
      "status": "sent",
      "created_at": "2023-05-15T18:00:00Z"
    },
    {
      "id": 2,
      "to": ["admin@example.com"],
      "subject": "Новая заявка",
      "message": "Поступила новая заявка #REQ-001",
      "template": "new_request",
      "context": {
        "request_number": "REQ-001",
        "client_name": "Иванов Иван"
      },
      "status": "sent",
      "created_at": "2023-05-16T09:00:00Z"
    }
  ]
}
```

#### Получение деталей отправленного email

**Запрос:**
```http
GET /api/email-history/{id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "id": 1,
  "to": ["user@example.com"],
  "subject": "Уведомление о статусе отправки",
  "message": "Ваша отправка #SHP-001 изменила статус на 'В пути'",
  "template": "shipment_status_change",
  "context": {
    "shipment_number": "SHP-001",
    "status": "В пути",
    "company_name": "Логистик Групп"
  },
  "status": "sent",
  "created_at": "2023-05-15T18:00:00Z",
  "error_message": null
}
```

#### Повторная отправка email

**Запрос:**
```http
POST /api/email-history/{id}/resend/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "message": "Email успешно отправлен повторно",
  "recipients": ["user@example.com"]
}
``` 