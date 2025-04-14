import { api } from '@/lib/api';
import { 
  Company, 
  CompanyListResponse, 
  CompanyQueryParams, 
  CreateCompanyRequest, 
  UpdateCompanyRequest 
} from '@/types/company';

/**
 * Сервис для работы с компаниями
 * Доступен только для суперпользователей
 */
const companyService = {
  /**
   * Получение списка компаний с пагинацией
   */
  getCompanies: async (params?: CompanyQueryParams): Promise<CompanyListResponse> => {
    const response = await api.get<CompanyListResponse>('/companies/', { params });
    return response.data;
  },

  /**
   * Получение компании по ID
   */
  getCompanyById: async (id: string): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${id}/`);
    return response.data;
  },

  /**
   * Создание новой компании
   */
  createCompany: async (data: CreateCompanyRequest): Promise<Company> => {
    const response = await api.post<Company>('/companies/', data);
    return response.data;
  },

  /**
   * Обновление компании
   */
  updateCompany: async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
    const response = await api.put<Company>(`/companies/${id}/`, data);
    return response.data;
  },

  /**
   * Удаление компании
   */
  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}/`);
  },
  
  /**
   * Получение администраторов компании
   */
  getCompanyAdmins: async (companyId: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/companies/${companyId}/admins/`);
    return response.data;
  },
  
  /**
   * Добавление администратора в компанию
   */
  addCompanyAdmin: async (companyId: string, data: { email: string; first_name: string; last_name: string; password: string; }): Promise<any> => {
    const response = await api.post<any>(`/companies/${companyId}/admins/`, data);
    return response.data;
  },
  
  /**
   * Удаление администратора из компании
   */
  removeCompanyAdmin: async (companyId: string, adminId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/admins/${adminId}/`);
  }
};

export default companyService; 