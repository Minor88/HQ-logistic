# HQ-Logistic Backend

Бэкенд для логистической платформы HQ-Logistic, реализованный на Django и Django REST Framework.

## Возможности

- Мультитенантная архитектура (разделение данных по компаниям)
- Система ролей пользователей (суперпользователь, администратор, руководитель, менеджер, склад, клиент)
- Управление отправками и заявками
- Управление файлами (документами)
- Финансовый учет и расчеты
- REST API для работы с фронтендом

## Требования

- Python 3.8+
- Django 5.1+
- PostgreSQL (через Supabase) или SQLite для разработки

## Установка и запуск

1. Клонируйте репозиторий:
```
git clone https://github.com/your-username/HQ-logistic.git
cd HQ-logistic/backend
```

2. Создайте и активируйте виртуальное окружение:
```
python -m venv venv
source venv/bin/activate  # для Linux/Mac
venv\Scripts\activate     # для Windows
```

3. Установите зависимости:
```
pip install -r requirements.txt
```

4. Создайте файл `.env` на основе примера:
```
cp .env.example .env
```

5. Отредактируйте файл `.env` и укажите настройки подключения к базе данных и другие параметры.

6. Применить миграции базы данных:
```
python manage.py migrate
```

7. Создайте суперпользователя:
```
python manage.py createsuperuser
```

8. Запустите сервер разработки:
```
python manage.py runserver
```

## Структура проекта

- `backend/` - Основной модуль проекта Django
- `logistic/` - Приложение для логистической платформы
- `media/` - Директория для загруженных файлов
- `static/` - Директория для статических файлов

## API

Подробное описание API доступно в файле [Backend_Documentation.md](Backend_Documentation.md).

## Подключение к Supabase

1. Создайте проект в [Supabase](https://supabase.com/)
2. Получите URL подключения к базе данных PostgreSQL
3. Укажите URL в переменной `DATABASE_URL` в файле `.env`

## Разработка

### Внесение изменений в модели

После внесения изменений в модели данных не забудьте создать и применить миграции:

```
python manage.py makemigrations
python manage.py migrate
```

### Запуск тестов

```
python manage.py test
```

## Лицензия

Этот проект распространяется под лицензией [MIT License](LICENSE). 