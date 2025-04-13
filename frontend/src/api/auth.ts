import axios from 'axios';
import { LoginData, RegisterData, User, UpdateUserRequest, ChangePasswordRequest } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL;

interface LoginResponse {
  access: string;
  refresh: string;
}

export const login = async (data: LoginData): Promise<{ token: string; user: User }> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/jwt/create/`, data);
  const token = response.data.access;
  localStorage.setItem('token', token);
  localStorage.setItem('refresh', response.data.refresh);
  
  const userResponse = await getCurrentUser();
  return { token, user: userResponse };
};

export const register = async (data: RegisterData): Promise<User> => {
  const response = await axios.post(`${API_URL}/auth/users/`, data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (token) {
    await axios.post(`${API_URL}/auth/jwt/logout/`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
  }
};

export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.get(`${API_URL}/auth/users/me/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateCurrentUser = async (data: UpdateUserRequest): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.put(`${API_URL}/auth/users/me/`, data, {
    headers: { Authorization: `Token ${token}` }
  });
  return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  await axios.post(`${API_URL}/auth/users/set_password/`, data, {
    headers: { Authorization: `Token ${token}` }
  });
};

export const getUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.get(`${API_URL}/userprofiles/`, {
    headers: { Authorization: `Token ${token}` }
  });
  return response.data;
};

export const getUser = async (id: number): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.get(`${API_URL}/userprofiles/${id}/`, {
    headers: { Authorization: `Token ${token}` }
  });
  return response.data;
};

export const updateUser = async (id: number, data: UpdateUserRequest): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.put(`${API_URL}/userprofiles/${id}/`, data, {
    headers: { Authorization: `Token ${token}` }
  });
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  await axios.delete(`${API_URL}/userprofiles/${id}/`, {
    headers: { Authorization: `Token ${token}` }
  });
}; 