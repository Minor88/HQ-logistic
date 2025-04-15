import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface ShipmentFolder {
  id: number;
  name: string;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  files: ShipmentFile[];
}

export interface ShipmentFile {
  id: number;
  file: string;
  folder: number | null;
  folder_name: string | null;
  uploaded_by: number | null;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface FilesResponse {
  files: ShipmentFile[];
  folders: ShipmentFolder[];
  all_files: ShipmentFile[];
}

const fileService = {
  // Получение списка файлов и папок отправления
  getShipmentFiles: async (shipmentId: string | number): Promise<FilesResponse> => {
    const { data } = await api.get<FilesResponse>(`/shipments/${shipmentId}/files/`);
    return data;
  },

  // Получение файлов из конкретной папки
  getFolderFiles: async (shipmentId: string | number, folderId: number): Promise<ShipmentFile[]> => {
    const { data } = await api.get<FilesResponse>(`/shipments/${shipmentId}/files/`);
    const folder = data.folders.find(f => f.id === folderId);
    return folder?.files || [];
  },

  // Создание новой папки
  createFolder: async (shipmentId: string | number, folderName: string): Promise<ShipmentFolder> => {
    const { data } = await api.post<ShipmentFolder>(`/shipments/${shipmentId}/create-folder/`, { folder_name: folderName });
    return data;
  },

  // Удаление папки
  deleteFolder: async (shipmentId: string | number, folderId: number): Promise<void> => {
    await api.delete(`/shipments/${shipmentId}/folders/${folderId}/`);
  },

  // Загрузка файлов
  uploadFiles: async (shipmentId: string | number, files: File[], folderId?: number): Promise<ShipmentFile[]> => {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (folderId) {
      formData.append('folder_id', folderId.toString());
    }
    
    const { data } = await api.post<ShipmentFile[]>(`/shipments/${shipmentId}/upload_files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return data;
  },

  // Удаление файла
  deleteFile: async (shipmentId: string | number, fileId: number): Promise<void> => {
    await api.delete(`/shipments/${shipmentId}/files/${fileId}/`);
  },

  // Скачивание файла
  downloadFile: async (shipmentId: string | number, fileId: number, fileName: string): Promise<void> => {
    try {
      // Используем api клиент для сохранения авторизации
      const response = await api.get(`/shipments/${shipmentId}/download-file/${fileId}/`, {
        responseType: 'blob'
      });
      
      // Создаем объект URL для blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Симулируем клик для скачивания
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем URL объект
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      toast.error('Не удалось скачать файл');
      throw error;
    }
  },

  // Скачивание всех файлов
  downloadAllFiles: async (shipmentId: string | number): Promise<void> => {
    try {
      // Используем api клиент для сохранения авторизации
      const response = await api.get(`/shipments/${shipmentId}/download-all-files/`, {
        responseType: 'blob'
      });
      
      // Создаем объект URL для blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipment_${shipmentId}_files.zip`);
      
      // Симулируем клик для скачивания
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем URL объект
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании всех файлов:', error);
      toast.error('Не удалось скачать файлы');
      throw error;
    }
  }
};

export default fileService; 