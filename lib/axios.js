import axios from 'axios';
import { useAuthStore, getSessionToken } from '@/store/useAuthStore';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname) {
      return `http://${hostname}:5000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token & Log Outgoing Request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname) {
        config.baseURL = `http://${hostname}:5000/api`;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        config.baseURL = process.env.NEXT_PUBLIC_API_URL;
      }
    }

    const token = useAuthStore.getState().token || getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🚀 [FRONTEND OUTGOING REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Handling & Log Incoming Response
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [FRONTEND INCOMING RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} | Status: ${response.status}`);
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status || error.status || 'NETWORK_ERROR';
    const method = error.config?.method ? error.config.method.toUpperCase() : 'API';
    const url = error.config?.url || '';
    const message = error.response?.data?.message || (error.response ? error.message : 'Cannot connect to backend server. Make sure backend is running on port 5000.');

    const isExpectedNotFound = status === 404 && url.includes('/roles/slug/');
    const isExpectedSessionCheck = status === 401 && url.includes('/auth/me');
    if (process.env.NODE_ENV === 'development' && error.response && status !== 402 && !isExpectedNotFound && !isExpectedSessionCheck) {
      console.warn(`⚠️ [FRONTEND API RESPONSE ERROR] ${method} ${url} | Status: ${status}`, error.response?.data || message);
    }

    if (status === 401) {
      // Clear token & redirect to appropriate login (role-specific portal if employee, /login if ADMIN) on 401 Unauthorized
      if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
      }
    }

    const customError = new Error(message);
    customError.status = status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export default apiClient;

