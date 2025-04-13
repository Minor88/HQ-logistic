export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  company?: Company;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: number;
  company: number;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  delivery_date: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStatus {
  id: number;
  name: string;
  description: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
} 