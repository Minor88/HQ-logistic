/**
 * Интерфейс компании
 */
export interface Company {
  id: number;
  name: string;
  inn?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Интерфейс запроса на создание/обновление компании
 */
export interface CompanyRequest {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Интерфейс пагинированного ответа со списком компаний
 */
export interface PaginatedCompanyList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Company[];
}

// Данные для создания компании
export interface CreateCompanyRequest {
  name: string;
  inn?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Альтернативное название для CreateCompanyRequest
export type CreateCompanyData = CreateCompanyRequest;

// Данные для обновления компании
export interface UpdateCompanyRequest {
  name?: string;
  inn?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Параметры запроса для списка компаний
export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Ответ со списком компаний и метаданными пагинации
export interface CompanyListResponse {
  results: Company[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Метаданные для отображения списка компаний
export interface CompanyListMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Состояние для хранения данных компаний
export interface CompanyState {
  companies: Company[];
  metadata: CompanyListMetadata;
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

export interface CompanyResponse {
  data: Company[];
  status: string;
  message?: string;
} 