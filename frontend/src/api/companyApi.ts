import { apiClient } from './apiClient';
import { Company, CreateCompanyRequest, UpdateCompanyRequest, CompanyResponse } from '../types/company';

const API_URL = '/api/companies/';

export const companyApi = {
  getCompanies: async (): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>(API_URL);
    return response.data;
  },

  getCompany: async (id: number): Promise<Company> => {
    const response = await apiClient.get<Company>(`${API_URL}${id}/`);
    return response.data;
  },

  createCompany: async (data: CreateCompanyRequest): Promise<Company> => {
    const response = await apiClient.post<CompanyResponse>(API_URL, data);
    return response.data;
  },

  updateCompany: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const response = await apiClient.put<CompanyResponse>(`${API_URL}${id}/`, data);
    return response.data;
  },

  deleteCompany: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_URL}${id}/`);
  }
}; 