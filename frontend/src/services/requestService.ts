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
  shipmentStatus?: number;
  shipmentStatusDisplay?: string;
  shipmentComment?: string;
  comment?: string;
  description?: string;
  warehouseNumber?: string;
  colMest?: number;
  declaredWeight?: number;
  declaredVolume?: number;
  actualWeight?: number;
  actualVolume?: number;
  createdAt?: string;
  updatedAt?: string;
  rate?: string;
  
  // Поддержка старого интерфейса для обратной совместимости
  places?: number;
  weight?: number;
  volume?: number;
  
  // Поддержка snake_case для обратной совместимости
  col_mest?: number;
  declared_weight?: number;
  declared_volume?: number;
  actual_weight?: number;
  actual_volume?: number;
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
  colMest?: number;
  declaredWeight?: number;
  declaredVolume?: number;
  actualWeight?: number;
  actualVolume?: number;
  rate?: string;
}

// Методы для работы с API заявок
const requestService = {
  // Получение списка заявок с учетом пагинации и параметров фильтрации/сортировки
  getRequests: async (params: Record<string, any> = {}): Promise<PaginatedResponse<Request>> => {
    const { data } = await api.get<PaginatedResponse<Request>>('/requests/', { params });
    
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
    
    // Обеспечиваем обратную совместимость с предыдущим интерфейсом
    normalizedData.results = normalizedData.results.map(request => ({
      ...request,
      places: request.colMest,
      weight: request.declaredWeight,
      volume: request.declaredVolume,
      // Добавляем поля с snake_case для совместимости с существующим кодом
      col_mest: request.colMest,
      declared_weight: request.declaredWeight,
      declared_volume: request.declaredVolume,
      actual_weight: request.actualWeight,
      actual_volume: request.actualVolume
    }));
    
    return normalizedData;
  },

  // Получение заявки по ID
  getRequestById: async (id: string): Promise<Request> => {
    const { data } = await api.get<Request>(`/requests/${id}/`);
    
    // Обеспечиваем обратную совместимость
    return {
      ...data,
      places: data.colMest,
      weight: data.declaredWeight,
      volume: data.declaredVolume,
      // Добавляем поля с snake_case для совместимости с существующим кодом
      col_mest: data.colMest,
      declared_weight: data.declaredWeight,
      declared_volume: data.declaredVolume,
      actual_weight: data.actualWeight,
      actual_volume: data.actualVolume
    };
  },

  // Создание новой заявки
  createRequest: async (requestData: RequestFormData): Promise<Request> => {
    const { data } = await api.post<Request>('/requests/', requestData);
    
    // Обеспечиваем обратную совместимость
    return {
      ...data,
      places: data.colMest,
      weight: data.declaredWeight,
      volume: data.declaredVolume,
      // Добавляем поля с snake_case для совместимости с существующим кодом
      col_mest: data.colMest,
      declared_weight: data.declaredWeight,
      declared_volume: data.declaredVolume,
      actual_weight: data.actualWeight,
      actual_volume: data.actualVolume
    };
  },

  // Обновление существующей заявки
  updateRequest: async (id: string, requestData: Partial<RequestFormData>): Promise<Request> => {
    const { data } = await api.put<Request>(`/requests/${id}/`, requestData);
    
    // Обеспечиваем обратную совместимость
    return {
      ...data,
      places: data.colMest,
      weight: data.declaredWeight,
      volume: data.declaredVolume,
      // Добавляем поля с snake_case для совместимости с существующим кодом
      col_mest: data.colMest,
      declared_weight: data.declaredWeight,
      declared_volume: data.declaredVolume,
      actual_weight: data.actualWeight,
      actual_volume: data.actualVolume
    };
  },

  // Метод для обновления статуса, комментария и фактических веса/объема заявки (для роли warehouse)
  updateRequestStatus: async (id: string, statusData: { 
    status: number, 
    comment?: string,
    actualWeight?: number,
    actualVolume?: number
  }): Promise<Request> => {
    const { data } = await api.post<Request>(`/requests/${id}/update-status/`, statusData);
    
    // Обеспечиваем обратную совместимость
    return {
      ...data,
      places: data.colMest,
      weight: data.declaredWeight,
      volume: data.declaredVolume,
      // Добавляем поля с snake_case для совместимости с существующим кодом
      col_mest: data.colMest,
      declared_weight: data.declaredWeight,
      declared_volume: data.declaredVolume,
      actual_weight: data.actualWeight,
      actual_volume: data.actualVolume
    };
  },

  // Удаление заявки
  deleteRequest: async (id: string): Promise<void> => {
    await api.delete(`/requests/${id}/`);
  },

  // Получение всех статусов заявок
  getRequestStatuses: async (): Promise<RequestStatus[]> => {
    const { data } = await api.get<PaginatedResponse<RequestStatus>>('/request-statuses/');
    return Array.isArray(data) ? data : data.results || [];
  },
  
  // Получение файлов заявки
  getRequestFiles: async (id: string): Promise<any[]> => {
    const { data } = await api.get<any[]>(`/requests/${id}/files/`);
    return data;
  },
  
  // Загрузка файлов для заявки
  uploadRequestFiles: async (id: string, files: File[], folderId?: number): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (folderId) {
      formData.append('folder', folderId.toString());
    }
    
    const { data } = await api.post(`/requests/${id}/upload-files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  },
  
  // Скачивание всех файлов заявки
  downloadAllFiles: async (id: string): Promise<Blob> => {
    const response = await api.get(`/requests/${id}/download-all-files/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default requestService; 