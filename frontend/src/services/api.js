import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

let inMemoryToken = sessionStorage.getItem('trace_access_token') || null;

export function setAuthToken(token) {
  inMemoryToken = token;
  if (token) {
    sessionStorage.setItem('trace_access_token', token);
  } else {
    sessionStorage.removeItem('trace_access_token');
  }
}

export function getAuthToken() {
  return inMemoryToken || sessionStorage.getItem('trace_access_token');
}

// Reusable Axios instance with base URL from environment
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for uniform error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'Network request failed',
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.error?.details || [],
    };
    return Promise.reject(customError);
  }
);

/**
 * Checks connectivity to the backend health endpoint
 */
export async function checkBackendHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

export default apiClient;
