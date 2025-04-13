# API Документация HQ Logistic

## Базовая конфигурация

```typescript
const API_BASE_URL = 'http://localhost:8000';  // для разработки
// const API_BASE_URL = 'https://api.hq-logistic.com';  // для продакшена
```

## Аутентификация

Все запросы (кроме логина и регистрации) требуют JWT токен в заголовке:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Авторизация

```typescript
// Логин
POST /api/auth/token/login/
body: {
  email: string;
  password: string;
}
response: {
  auth_token: string;
}

// Выход
POST /api/auth/token/logout/
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Основные эндпоинты

### Аналитика

```typescript
// Получение сводной аналитики
GET /api/analytics/summary/
response: {
  totalShipments: number;
  activeShipments: number;
  totalRequests: number;
  activeRequests: number;
  // ... другие метрики
}
```

### Компании

```typescript
// Получение списка компаний
GET /api/companies/
response: Company[]

// Создание компании
POST /api/companies/
body: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Получение информации о компании
GET /api/companies/{id}/

// Обновление компании
PUT /api/companies/{id}/
body: {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Удаление компании
DELETE /api/companies/{id}/
```

### Отправки (Shipments)

```typescript
// Получение списка отправок
GET /api/shipments/
query: {
  page?: number;
  status?: string;
  search?: string;
}
response: {
  count: number;
  next: string | null;
  previous: string | null;
  results: Shipment[];
}

// Создание отправки
POST /api/shipments/
body: {
  number: string;
  status: string;
  comment?: string;
}

// Получение информации об отправке
GET /api/shipments/{id}/

// Обновление отправки
PUT /api/shipments/{id}/
body: {
  status?: string;
  comment?: string;
}

// Удаление отправки
DELETE /api/shipments/{id}/

// Работа с файлами отправки
POST /api/shipments/{id}/upload-files/
body: FormData

GET /api/shipments/{id}/files/
response: {
  files: ShipmentFile[];
  folders: ShipmentFolder[];
}

POST /api/shipments/{id}/create-folder/
body: {
  name: string;
}

DELETE /api/shipments/{id}/files/{fileId}/
DELETE /api/shipments/{id}/folders/{folderId}/
```

### Заявки (Requests)

```typescript
// Получение списка заявок
GET /api/requests/
query: {
  page?: number;
  status?: string;
  search?: string;
}
response: {
  count: number;
  next: string | null;
  previous: string | null;
  results: Request[];
}

// Создание заявки
POST /api/requests/
body: {
  number: string;
  description?: string;
  warehouse_number?: string;
  col_mest?: number;
  declared_weight?: number;
  declared_volume?: number;
  actual_weight?: number;
  actual_volume?: number;
  rate?: object;
  comment?: string;
  status: string;
  client?: number;
  manager?: number;
  shipment?: number;
}

// Получение информации о заявке
GET /api/requests/{id}/

// Обновление заявки
PUT /api/requests/{id}/
body: {
  status?: string;
  comment?: string;
  // ... другие поля
}

// Удаление заявки
DELETE /api/requests/{id}/

// Работа с файлами заявки
POST /api/requests/{id}/upload-files/
body: FormData

GET /api/requests/{id}/files/
response: {
  files: RequestFile[];
}

DELETE /api/requests/{id}/files/{fileId}/
```

### Финансы

```typescript
// Получение списка финансовых операций
GET /api/finance/
query: {
  page?: number;
  operation_type?: string;
  currency?: string;
}
response: {
  count: number;
  results: Finance[];
}

// Создание финансовой операции
POST /api/finance/
body: {
  number: string;
  operation_type: string;
  payment_date: string;
  document_type: string;
  currency: string;
  counterparty: string;
  article: string;
  amount: number;
  shipment?: number;
  request?: number;
  basis?: number;
  is_paid: boolean;
}

// Получение информации о финансовой операции
GET /api/finance/{number}/

// Обновление финансовой операции
PUT /api/finance/{number}/
body: {
  payment_date?: string;
  amount?: number;
  is_paid?: boolean;
  // ... другие поля
}

// Удаление финансовой операции
DELETE /api/finance/{number}/
```

### Расчеты отправок

```typescript
// Получение расчета по ID отправки
GET /api/shipment-calculations/by-shipment/{shipmentId}/
response: ShipmentCalculation

// Расчет затрат
POST /api/shipment-calculations/{id}/calculate-costs/
body: {
  euro_rate?: number;
  usd_rate?: number;
}
response: {
  requests: Array<{
    id: number;
    client: string;
    number: string;
    costs: Array<{
      amount: number;
      currency: string;
      description: string;
      rub_amount: number;
    }>;
  }>;
  totals: {
    usd: number;
    eur: number;
    rub: number;
  };
}

// Получение расходов
GET /api/shipment-calculations/{id}/expenses/
response: {
  expenses: Array<{
    amount: number;
    currency: string;
    description: string;
  }>;
}
```

## Типы данных

```typescript
interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

interface Shipment {
  id: number;
  number: string;
  company: number;
  status: string;
  comment?: string;
  created_at: string;
  created_by: number;
}

interface Request {
  id: number;
  number: string;
  company: number;
  description?: string;
  warehouse_number?: string;
  col_mest?: number;
  declared_weight?: number;
  declared_volume?: number;
  actual_weight?: number;
  actual_volume?: number;
  rate?: object;
  comment?: string;
  status: string;
  client?: number;
  manager?: number;
  shipment?: number;
  created_at: string;
}

interface Finance {
  id: number;
  number: string;
  company: number;
  operation_type: string;
  payment_date: string;
  document_type: string;
  currency: string;
  counterparty: string;
  article: string;
  amount: number;
  shipment?: number;
  request?: number;
  basis?: number;
  is_paid: boolean;
  created_by: number;
  created_at: string;
}

interface ShipmentCalculation {
  id: number;
  shipment: number;
  euro_rate: number;
  usd_rate: number;
  created_at: string;
  updated_at: string;
}
```

## Обработка ошибок

Все ошибки возвращаются в формате:

```typescript
interface ErrorResponse {
  error: string;
  detail?: string;
  code?: string;
}
```

Основные коды ошибок:
- 400: Неверный запрос
- 401: Не авторизован
- 403: Доступ запрещен
- 404: Не найдено
- 500: Внутренняя ошибка сервера

## Примеры использования

```typescript
// Пример авторизации
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/token/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  return data.auth_token;
};

// Пример получения списка отправок
const getShipments = async (token: string, page = 1) => {
  const response = await fetch(`${API_BASE_URL}/api/shipments/?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch shipments');
  }
  
  return response.json();
};

// Пример создания заявки
const createRequest = async (token: string, requestData: Partial<Request>) => {
  const response = await fetch(`${API_BASE_URL}/api/requests/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create request');
  }
  
  return response.json();
};
``` 