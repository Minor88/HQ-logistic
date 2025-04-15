import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/user';

// Интерфейс для статуса заявки
export interface RequestStatus {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isFinal: boolean;
  order: number;
}

// Интерфейс для данных заявки
export interface Request {
  id: number;
  number: string;
  company?: number;
  companyName?: string;
  status: number;
  statusCode?: string;
  statusDisplay?: string;
  client: number;
  clientName?: string;
  manager?: number;
  managerName?: string;
  shipment?: number;
  shipmentNumber?: string;
  comment?: string;
  description?: string;
  warehouseNumber?: string;
  places?: number;
  weight?: number;
  volume?: number;
  actual_weight?: number;
  actual_volume?: number;
  createdAt?: string;
  updatedAt?: string;
  rate?: string;
}

export interface RequestFormData {
  number: string;
  status: number;
  client: number;
  manager?: number;
  shipment?: number;
  comment?: string;
  description?: string;
  warehouseNumber?: string;
  places?: number;
  weight?: number;
  volume?: number;
  actual_weight?: number;
  actual_volume?: number;
  rate?: string;
}

// Методы для работы с API заявок
const requestService = {
  // Получение списка заявок с учетом пагинации
  getRequests: async (): Promise<PaginatedResponse<Request>> => {
    const { data } = await api.get<PaginatedResponse<Request>>('/requests/');
    
    // Проверка на формат ответа
    let normalizedData: PaginatedResponse<Request>;
    
    if (Array.isArray(data)) {
      // Если сервер вернул просто массив, преобразуем его в пагинированный формат
      normalizedData = {
        count: data.length,
        next: null,
        previous: null,
        results: data
      };
    } else {
      // Если сервер вернул пагинированный ответ, используем его
      normalizedData = data;
    }
    
    return normalizedData;
  },

  // Получение заявки по ID
  getRequestById: async (id: string): Promise<Request> => {
    const { data } = await api.get<Request>(`/requests/${id}/`);
    return data;
  },

  // Создание новой заявки
  createRequest: async (requestData: RequestFormData): Promise<Request> => {
    const { data } = await api.post<Request>('/requests/', requestData);
    return data;
  },

  // Обновление существующей заявки
  updateRequest: async (id: string, requestData: Partial<RequestFormData>): Promise<Request> => {
    const { data } = await api.put<Request>(`/requests/${id}/`, requestData);
    return data;
  },

  // Метод для обновления статуса, комментария и фактических веса/объема заявки (для роли warehouse)
  updateRequestStatus: async (id: string, statusData: { 
    status: number, 
    comment?: string,
    actual_weight?: number,
    actual_volume?: number
  }): Promise<Request> => {
    const { data } = await api.post<Request>(`/requests/${id}/update-status/`, statusData);
    return data;
  },

  // Удаление заявки
  deleteRequest: async (id: string): Promise<void> => {
    await api.delete(`/requests/${id}/`);
  },

  // Получение всех статусов заявок
  getRequestStatuses: async (): Promise<RequestStatus[]> => {
    const { data } = await api.get<PaginatedResponse<RequestStatus>>('/request-statuses/');
    return Array.isArray(data) ? data : data.results || [];
  }
};

export default requestService; 