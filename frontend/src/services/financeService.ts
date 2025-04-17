import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/user';

/**
 * Интерфейс статьи расходов/доходов
 */
export interface Article {
  id: number;
  name: string;
  type: 'in' | 'out' | 'both';
  createdAt: string;
  updatedAt: string;
}

/**
 * Интерфейс финансовой операции
 */
export interface Finance {
  number: string;
  operationType: 'in' | 'out';
  operationTypeDisplay?: string;
  paymentDate: string;
  documentType: string;
  documentTypeDisplay?: string;
  currency: string;
  currencyDisplay?: string;
  counterparty?: number;
  counterpartyName?: string;
  article?: number;
  articleName?: string;
  amount?: number;
  isPaid: boolean;
  shipment?: number;
  shipmentNumber?: string;
  request?: number;
  requestNumber?: string;
  basis?: number;
  comment?: string;
  createdAt: string;
  updatedBy?: number;
  updatedByName?: string;
  createdBy: number;
  createdByName?: string;
  company?: number;
}

/**
 * Интерфейс данных формы для создания/редактирования финансовой операции
 */
export interface FinanceFormData {
  operationType: string;
  paymentDate: string;
  documentType: string;
  currency: string;
  counterparty?: number;
  article?: number;
  amount?: number;
  isPaid: boolean;
  shipment?: number;
  request?: number;
  basis?: number;
  comment?: string;
  company?: number;
}

/**
 * Получение списка финансовых операций
 */
const getFinances = async (): Promise<PaginatedResponse<Finance>> => {
  const response = await api.get<PaginatedResponse<Finance>>('/api/finances/');
  return response.data;
};

/**
 * Получение списка статей расходов/доходов
 */
const getArticles = async (): Promise<Article[]> => {
  const response = await api.get<Article[]>('/api/articles/');
  return response.data;
};

/**
 * Создание финансовой операции
 */
const createFinance = async (data: FinanceFormData): Promise<Finance> => {
  const response = await api.post<Finance>('/api/finances/', data);
  return response.data;
};

/**
 * Обновление финансовой операции
 */
const updateFinance = async (id: string, data: FinanceFormData): Promise<Finance> => {
  const response = await api.put<Finance>(`/api/finances/${id}/`, data);
  return response.data;
};

/**
 * Удаление финансовой операции
 */
const deleteFinance = async (id: string): Promise<void> => {
  await api.delete(`/api/finances/${id}/`);
};

/**
 * Создание статьи расходов/доходов
 */
const createArticle = async (data: { name: string, type: 'in' | 'out' | 'both' }): Promise<Article> => {
  const response = await api.post<Article>('/api/articles/', data);
  return response.data;
};

/**
 * Обновление статьи расходов/доходов
 */
const updateArticle = async (id: number, data: { name: string, type: 'in' | 'out' | 'both' }): Promise<Article> => {
  const response = await api.put<Article>(`/api/articles/${id}/`, data);
  return response.data;
};

/**
 * Удаление статьи расходов/доходов
 */
const deleteArticle = async (id: number): Promise<void> => {
  await api.delete(`/api/articles/${id}/`);
};

const financeService = {
  getFinances,
  getArticles,
  createFinance,
  updateFinance,
  deleteFinance,
  createArticle,
  updateArticle,
  deleteArticle
};

export default financeService; 