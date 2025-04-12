import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Company } from '@/types';

export const useCompanies = () => {
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies/');
      return data.results;
    },
  });

  const createCompany = useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'created_at'>) => {
      const { data } = await api.post('/companies/', company);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...company }: Partial<Company> & { id: number }) => {
      const { data } = await api.put(`/companies/${id}/`, company);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/companies/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  return {
    companies,
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}; 