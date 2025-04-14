import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Company, CompanyRequest } from '../types/company';
import companyService from '../services/companyService';

// Типы для параметров запроса компаний
type CompanyQueryParams = {
  page?: number;
  search?: string;
  ordering?: string;
  limit?: number;
};

/**
 * Хук для получения списка компаний
 */
export const useCompanyList = (params?: CompanyQueryParams) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyService.getCompanies(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

/**
 * Хук для получения детальной информации о компании
 */
export const useCompanyDetails = (id: number) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
  });
};

/**
 * Хук для создания новой компании
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyRequest) => companyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

/**
 * Хук для обновления компании
 */
export const useUpdateCompany = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyRequest) => companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

/**
 * Хук для удаления компании
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

/**
 * Комбинированный хук для работы с компаниями
 */
export function useCompanies() {
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<CompanyQueryParams>({
    page: 1,
    search: '',
    ordering: '',
    limit: 10, // Добавляем лимит по умолчанию
  });

  // Запрос на получение списка компаний
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useCompanyList(queryParams);

  // Преобразуем данные в нужный формат
  const companies = data?.results || [];
  const metadata = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 10,
    total: data?.count || 0,
    totalPages: Math.ceil((data?.count || 0) / (queryParams.limit || 10)),
  };

  // Функция для изменения параметров запроса
  const setPage = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // Функция для изменения поискового запроса
  const setSearch = (search: string) => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  };
  
  // Функция для изменения лимита на странице
  const setLimit = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  // Функция для изменения сортировки
  const setOrdering = (ordering: string) => {
    setQueryParams((prev) => ({ ...prev, ordering }));
  };

  // Функция для сброса всех фильтров
  const resetFilters = () => {
    setQueryParams({
      page: 1,
      search: '',
      ordering: '',
    });
  };

  // Мутации для работы с компаниями
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany(0); // ID будет передан при вызове
  const deleteMutation = useDeleteCompany();

  return {
    companies,
    metadata,
    data,
    isLoading,
    isError,
    error,
    queryParams,
    setPage,
    setSearch,
    setLimit,
    setOrdering,
    resetFilters,
    createCompany: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCompany: (id: number, data: CompanyRequest) => {
      // Нельзя использовать хуки внутри функций
      // Используем прямой вызов метода сервиса и обновляем кеш вручную
      return companyService.updateCompany(id, data).then(updatedCompany => {
        queryClient.invalidateQueries({ queryKey: ['company', id] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
        return updatedCompany;
      });
    },
    isUpdating: updateMutation.isPending,
    deleteCompany: (id: number) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending
  };
} 