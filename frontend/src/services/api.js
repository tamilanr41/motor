import axios from 'axios';

const configured = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = configured
  ? `${configured}${configured.endsWith('/api') ? '' : '/api'}`
  : '/api';

const apiOrigin = API_BASE_URL === '/api' ? '' : API_BASE_URL.replace(/\/api$/, '');

export const assetURL = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  return `${apiOrigin}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
api.interceptors.request.use(config => {
  const token = config.url?.startsWith('/admin') ? localStorage.getItem('la_admin_token') : localStorage.getItem('la_customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else if (config.headers.Authorization) delete config.headers.Authorization;
  return config;
});
export const unwrap = promise => promise.then(r => r.data);
