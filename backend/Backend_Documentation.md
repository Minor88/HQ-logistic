# Документация по бэкенду HQ-logistic

## Оглавление
1. [Обзор](#обзор)
2. [Структура проекта](#структура-проекта)
3. [Модели данных](#модели-данных)
4. [Аутентификация и права доступа](#аутентификация-и-права-доступа)
5. [API Endpoints](#api-endpoints)
6. [Работа с файлами](#работа-с-файлами)
7. [Установка и настройка](#установка-и-настройка)

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