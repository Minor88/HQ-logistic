import { axiosInstance } from './axios';
import { Company } from './types';

export const companiesApi = {
  getAll: () =>
    axiosInstance.get<Company[]>('/api/companies/'),

  getById: (id: number) =>
    axiosInstance.get<Company>(`/api/companies/${id}/`),

  create: (data: Partial<Company>) =>
    axiosInstance.post<Company>('/api/companies/', data),

  update: (id: number, data: Partial<Company>) =>
    axiosInstance.put<Company>(`/api/companies/${id}/`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/api/companies/${id}/`)
}; 