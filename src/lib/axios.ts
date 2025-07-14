import axios from 'axios';
import { getSupabaseClient } from './auth/supabase-client';

export const API_URL = process.env.API_URL
  ? process.env.API_URL
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const supabase = getSupabaseClient();

  if (supabase?.auth.getSession) {
    config.headers.Authorization = `Bearer ${supabase.auth.getSession()}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Handle 204 No Content responses
    if (response.status === 204) {
      response.data = { success: true };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 세션 갱신
      const supabase = getSupabaseClient();
      if (supabase?.auth.getSession) {
        originalRequest.headers.Authorization = `Bearer ${supabase.auth.getSession()}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
