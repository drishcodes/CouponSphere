import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5005/api/v1',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('couponSphereToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-device-id'] = localStorage.getItem('couponSphereDevice') ?? 'demo-device-premium-ui';
  return config;
});

