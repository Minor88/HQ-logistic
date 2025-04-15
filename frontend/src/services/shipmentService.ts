import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/user';

// Интерфейс для данных отправления
export interface ShipmentStatus {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isFinal: boolean;
  order: number;
}

export interface Shipment {
  id: number;
  number: string;
  company: number;
  companyName?: string;
  status: number;
  statusCode?: string;
  statusDisplay?: string;
  comment?: string;
  createdAt?: string;
  createdBy?: number;
  createdByName?: string;
  requestsCount?: number;
}

export interface ShipmentFormData {
  number: string;
  company?: number;
  status: number;
  comment?: string;
}

// Методы для работы с API отправлений
const shipmentService = {
  // Получение списка отправлений с учетом пагинации
  getShipments: async (): Promise<PaginatedResponse<Shipment>> => {
    const { data } = await api.get<PaginatedResponse<Shipment>>('/shipments/');
    
    // Проверка на формат ответа
    let normalizedData: PaginatedResponse<Shipment>;
    
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

  // Получение отправления по ID
  getShipmentById: async (id: string): Promise<Shipment> => {
    const { data } = await api.get<Shipment>(`/shipments/${id}/`);
    return data;
  },

  // Создание нового отправления
  createShipment: async (shipmentData: ShipmentFormData): Promise<Shipment> => {
    const { data } = await api.post<Shipment>('/shipments/', shipmentData);
    return data;
  },

  // Обновление существующего отправления
  updateShipment: async (id: string, shipmentData: Partial<ShipmentFormData>): Promise<Shipment> => {
    const { data } = await api.put<Shipment>(`/shipments/${id}/`, shipmentData);
    return data;
  },

  // Удаление отправления
  deleteShipment: async (id: string): Promise<void> => {
    await api.delete(`/shipments/${id}/`);
  },

  // Получение всех статусов отправлений
  getShipmentStatuses: async (): Promise<ShipmentStatus[]> => {
    const { data } = await api.get<PaginatedResponse<ShipmentStatus>>('/shipment-statuses/');
    return Array.isArray(data) ? data : data.results || [];
  }
};

export default shipmentService; 