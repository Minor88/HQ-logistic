// Базовая информация о компании
export interface Company {
  id: string;
  name: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Данные для создания компании
export interface CreateCompanyRequest {
  name: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Альтернативное название для CreateCompanyRequest
export type CreateCompanyData = CreateCompanyRequest;

// Данные для обновления компании
export interface UpdateCompanyRequest {
  name?: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
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