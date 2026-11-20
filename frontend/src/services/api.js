import axios from 'axios';
import { getActiveCatalogue, fallbackProducts, fallbackProduct, fallbackBrand } from '../utils/catalogue.js';
import { loadLocalStore } from '../admin/mockData.js';

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
  const isGet = !config?.method || config.method.toLowerCase() === 'get';
  const url = (config.url || '').split('?')[0];
  const isPublic = !config.url?.startsWith('/admin') && !config.url?.startsWith('/customer');

  // Real-time synchronization:
  // If local admin store exists in browser (which holds real-time admin additions, updates & deletions)
  if (isGet && isPublic && typeof window !== 'undefined' && localStorage.getItem('la_admin_store_v2')) {
    config.adapter = async () => {
      const active = getActiveCatalogue();

      if (url === '/settings/public') {
        return { data: active.settings, status: 200, statusText: 'OK', config, headers: {} };
      }
      if (url === '/categories') {
        return { data: active.categories, status: 200, statusText: 'OK', config, headers: {} };
      }
      if (url === '/brands') {
        return { data: active.brands, status: 200, statusText: 'OK', config, headers: {} };
      }
      if (url === '/banners') {
        return { data: active.banners, status: 200, statusText: 'OK', config, headers: {} };
      }
      if (url === '/products') {
        return { data: fallbackProducts(config.params || {}), status: 200, statusText: 'OK', config, headers: {} };
      }
      const prodMatch = url.match(/^\/products\/([^/]+)/);
      if (prodMatch) {
        const prod = fallbackProduct(decodeURIComponent(prodMatch[1]));
        if (prod) return { data: prod, status: 200, statusText: 'OK', config, headers: {} };
      }
      const brandMatch = url.match(/^\/brands\/([^/]+)/);
      if (brandMatch) {
        const br = fallbackBrand(decodeURIComponent(brandMatch[1]));
        if (br) return { data: br, status: 200, statusText: 'OK', config, headers: {} };
      }
      if (url.startsWith('/content/')) {
        return { data: null, status: 200, statusText: 'OK', config, headers: {} };
      }

      return { data: active.products, status: 200, statusText: 'OK', config, headers: {} };
    };
  }

  const token = config.url?.startsWith('/admin') ? localStorage.getItem('la_admin_token') : localStorage.getItem('la_customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else if (config.headers.Authorization) delete config.headers.Authorization;
  return config;
});

// Automatic graceful fallback for public GET endpoints if database connection is offline
api.interceptors.response.use(
  res => res,
  err => {
    const config = err.config;
    const isGet = !config?.method || config.method.toLowerCase() === 'get';
    const isPublic = config?.url && !config.url.startsWith('/admin') && !config.url.startsWith('/customer');
    const isAdmin = config?.url && config.url.startsWith('/admin');

    // Never fabricate an admin session. Only soften read-only admin list
    // failures while the backend is unavailable; auth errors must surface.
    if (isGet && isAdmin && (err.response?.status === 500 || err.code === 'ERR_NETWORK')) {
      const url = (config.url || '').split('?')[0];
      const store = loadLocalStore();

      if (url === '/admin/overview') {
        const enquiries = store.enquiries || [];
        return Promise.resolve({
          data: {
            total_products: store.products?.length || 171,
            total_categories: store.categories?.length || 13,
            total_brands: store.brands?.length || 10,
            total_customers: store.customers?.length || 5,
            total_enquiries: enquiries.length,
            new_enquiries: enquiries.filter(e => e.status === 'New').length,
            pending_quotations: enquiries.filter(e => ['New', 'Contacted', 'Quotation Sent', 'Follow-up'].includes(e.status)).length,
            recent: enquiries.slice(0, 8)
          },
          status: 200,
          statusText: 'OK',
          config,
          headers: {}
        });
      }
      if (url === '/admin/products') {
        let list = store.products || [];
        const q = config.params?.q?.toLowerCase();
        if (q) {
          list = list.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.category_name?.toLowerCase().includes(q) ||
            p.model_number?.toLowerCase().includes(q) ||
            p.hp_rating?.toLowerCase().includes(q)
          );
        }
        return Promise.resolve({ data: list, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/categories') {
        return Promise.resolve({ data: store.categories || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/brands') {
        return Promise.resolve({ data: store.brands || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/enquiries') {
        return Promise.resolve({ data: store.enquiries || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/customers') {
        return Promise.resolve({ data: store.customers || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/banners') {
        return Promise.resolve({ data: store.banners || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/settings') {
        return Promise.resolve({ data: store.settings || {}, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/team') {
        return Promise.resolve({ data: store.team || [], status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/admin/activity') {
        return Promise.resolve({ data: store.activity || [], status: 200, statusText: 'OK', config, headers: {} });
      }
    }

    if (isGet && isPublic && (err.response?.status === 500 || err.code === 'ERR_NETWORK')) {
      const url = (config.url || '').split('?')[0];
      const active = getActiveCatalogue();

      if (url === '/settings/public') {
        return Promise.resolve({ data: active.settings, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/categories') {
        return Promise.resolve({ data: active.categories, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/brands') {
        return Promise.resolve({ data: active.brands, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/banners') {
        return Promise.resolve({ data: active.banners, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url === '/products') {
        return Promise.resolve({ data: fallbackProducts(config.params || {}), status: 200, statusText: 'OK', config, headers: {} });
      }
      const prodMatch = url.match(/^\/products\/([^/]+)/);
      if (prodMatch) {
        const prod = fallbackProduct(decodeURIComponent(prodMatch[1]));
        if (prod) return Promise.resolve({ data: prod, status: 200, statusText: 'OK', config, headers: {} });
      }
      const brandMatch = url.match(/^\/brands\/([^/]+)/);
      if (brandMatch) {
        const br = fallbackBrand(decodeURIComponent(brandMatch[1]));
        if (br) return Promise.resolve({ data: br, status: 200, statusText: 'OK', config, headers: {} });
      }
      if (url.startsWith('/content/')) {
        return Promise.resolve({ data: null, status: 200, statusText: 'OK', config, headers: {} });
      }
    }
    return Promise.reject(err);
  }
);

export const unwrap = promise => promise.then(r => r.data);
