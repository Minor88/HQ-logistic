import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import companyService from '@/services/companyService';
import { 
  Company, 
  CompanyListMetadata, 
  CompanyQueryParams, 
  CreateCompanyRequest, 
  UpdateCompanyRequest 
} from '@/types/company';
import { toast } from 'sonner';

/**
 * Хук для работы с данными компаний
 */
export function useCompanies() {
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<CompanyQueryParams>({
    page: 1,
    limit: 10,
    search: ''
  });
  
  // Запрос на получение списка компаний
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['companies', queryParams],
    queryFn: () => companyService.getCompanies(queryParams),
    select: (data) => {
      // Преобразуем данные в удобный для использования формат
      const metadata: CompanyListMetadata = {
        total: data.count,
        page: queryParams.page || 1,
        limit: queryParams.limit || 10,
        totalPages: Math.ceil(data.count / (queryParams.limit || 10))
      };
      
      return {
        companies: data.results,
        metadata
      };
    }
  });
  
  // Мутация для создания компании
  const createCompanyMutation = useMutation({
    mutationFn: (data: CreateCompanyRequest) => companyService.createCompany(data),
    onSuccess: () => {
      toast.success('Компания успешно создана');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(`Ошибка при создании компании: ${error.message}`);
    }
  });
  
  // Мутация для обновления компании
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyRequest }) => 
      companyService.updateCompany(id, data),
    onSuccess: () => {
      toast.success('Компания успешно обновлена');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(`Ошибка при обновлении компании: ${error.message}`);
    }
  });
  
  // Мутация для удаления компании
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: () => {
      toast.success('Компания успешно удалена');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(`Ошибка при удалении компании: ${error.message}`);
    }
  });
  
  // Функция для изменения параметров запроса
  const setPage = useCallback((page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  }, []);
  
  const setLimit = useCallback((limit: number) => {
    setQueryParams(prev => ({ ...prev, limit, page: 1 }));
  }, []);
  
  const setSearch = useCallback((search: string) => {
    setQueryParams(prev => ({ ...prev, search, page: 1 }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setQueryParams({
      page: 1,
      limit: 10,
      search: ''
    });
  }, []);
  
  return {
    companies: data?.companies || [],
    metadata: data?.metadata || { total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading,
    error,
    refetch,
    queryParams,
    setPage,
    setLimit,
    setSearch,
    resetFilters,
    createCompany: createCompanyMutation.mutate,
    isCreating: createCompanyMutation.isPending,
    updateCompany: updateCompanyMutation.mutate,
    isUpdating: updateCompanyMutation.isPending,
    deleteCompany: deleteCompanyMutation.mutate,
    isDeleting: deleteCompanyMutation.isPending
  };
} 