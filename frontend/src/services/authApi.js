import apiClient from './api';

export async function loginUser(credentials) {
  const response = await apiClient.post('/api/v1/auth/login', credentials);
  return response.data;
}

export async function registerUser(userData) {
  const response = await apiClient.post('/api/v1/auth/register', userData);
  return response.data;
}

export async function refreshSession(refreshToken) {
  const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
  return response.data;
}

export async function logoutUser(refreshToken) {
  const response = await apiClient.post('/api/v1/auth/logout', { refreshToken });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data;
}
