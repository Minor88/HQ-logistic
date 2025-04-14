import { api } from '@/lib/api';
import { 
  Company, 
  CompanyListResponse, 
  CompanyQueryParams, 
  CreateCompanyRequest, 
  UpdateCompanyRequest,
  CompanyRequest,
  PaginatedCompanyList
} from '@/types/company';
import { AdminFormData } from '@/types/auth';
import { UserProfile } from '@/types/user';

/**
 * Сервис для работы с компаниями
 * Доступен только для суперпользователей
 */
const companyService = {
  /**
   * Получение списка компаний с пагинацией
   */
  getCompanies: async (params?: { page?: number, search?: string, ordering?: string, limit?: number }): Promise<PaginatedCompanyList> => {
    // Преобразуем limit в page_size для совместимости с DRF
    const apiParams: any = { ...params };
    if (apiParams.limit) {
      apiParams.page_size = apiParams.limit;
      delete apiParams.limit;
    }
    
    const response = await api.get<PaginatedCompanyList>('/companies/', { params: apiParams });
    return response.data;
  },

  /**
   * Получение компании по ID
   */
  getCompanyById: async (id: number): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${id}/`);
    return response.data;
  },

  /**
   * Создание новой компании
   */
  createCompany: async (data: CompanyRequest): Promise<Company> => {
    const response = await api.post<Company>('/companies/', data);
    return response.data;
  },

  /**
   * Обновление компании
   */
  updateCompany: async (id: number, data: CompanyRequest): Promise<Company> => {
    const response = await api.put<Company>(`/companies/${id}/`, data);
    return response.data;
  },

  /**
   * Частичное обновление компании по ID
   */
  patchCompany: async (id: number, data: Partial<CompanyRequest>): Promise<Company> => {
    const response = await api.patch<Company>(`/companies/${id}/`, data);
    return response.data;
  },

  /**
   * Удаление компании
   */
  deleteCompany: async (id: number): Promise<void> => {
    await api.delete(`/companies/${id}/`);
  },
  
  /**
   * Получение администраторов компании
   */
  getCompanyAdmins: async (companyId: string): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>(`/companies/${companyId}/admins/`);
    return response.data;
  },
  
  /**
   * Добавление администратора в компанию
   */
  addCompanyAdmin: async (companyId: string, data: AdminFormData): Promise<UserProfile> => {
    const response = await api.post<UserProfile>(`/companies/${companyId}/add_admin/`, data);
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