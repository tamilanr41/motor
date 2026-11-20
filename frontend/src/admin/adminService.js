import { api } from '../services/api.js';
import { loadLocalStore, saveLocalStore, addLocalActivity } from './mockData.js';

export function isLocalFallbackActive() {
  const token = localStorage.getItem('la_admin_token') || '';
  return token.startsWith('demo_');
}

// Helper to determine if we should fall back to local store
function shouldUseLocalFallback(err) {
  if (!err) return false;
  if (isLocalFallbackActive()) return true;
  // If no response from server (network error, connection refused, 502/503/504)
  if (!err.response) return true;
  if ([502, 503, 504].includes(err.response.status)) return true;
  // If backend db is not configured and returns 500
  if (err.response.status === 500 && (err.response.data?.error?.includes('database') || err.response.data?.error?.includes('connect') || !err.response.data?.error)) {
    return true;
  }
  return false;
}

export const adminService = {
  // Auth
  async login(email, password) {
    const res = await api.post('/admin/auth/login', { email: email.trim(), password });
    return res.data;
  },

  async register(name, email, password, secret) {
    try {
      const res = await api.post('/admin/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        secret: secret.trim()
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 409) {
        throw new Error('An admin with this email address already exists.');
      }
      if (err.response?.status === 403) {
        throw new Error('Invalid Secret Code rejected by server.');
      }
      throw err;
    }
  },

  // Upload an image asset from local device (supports multipart API & offline Data URL fallback with canvas compression)
  async uploadAsset(file) {
    if (!file) throw new Error('No image file selected.');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/admin/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) return res.data.url;
    } catch {
      // Offline fallback: convert to optimized base64 Data URL so local storage persists it
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file from device.'));
      reader.onload = (e) => {
        const rawData = e.target.result;
        // If file is smaller than 400KB, return raw data directly
        if (file.size < 400 * 1024) {
          return resolve(rawData);
        }
        // Otherwise compress using canvas to keep local storage lightweight & prevent quota errors
        const img = new Image();
        img.onerror = () => resolve(rawData);
        img.onload = () => {
          try {
            const maxDimension = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } catch {
            resolve(rawData);
          }
        };
        img.src = rawData;
      };
      reader.readAsDataURL(file);
    });
  },

  async getMe() {
    const res = await api.get('/admin/auth/me');
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.post('/admin/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  // Overview / Dashboard
  async getOverview() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      const enquiries = store.enquiries || [];
      return {
        total_products: store.products?.length || 171,
        total_categories: store.categories?.length || 13,
        total_brands: store.brands?.length || 10,
        total_customers: store.customers?.length || 5,
        total_enquiries: enquiries.length,
        new_enquiries: enquiries.filter(e => e.status === 'New').length,
        pending_quotations: enquiries.filter(e => ['New', 'Contacted', 'Quotation Sent', 'Follow-up'].includes(e.status)).length,
        recent: enquiries.slice(0, 8)
      };
    }
    try {
      const res = await api.get('/admin/overview');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      const enquiries = store.enquiries || [];
      return {
        total_products: store.products?.length || 171,
        total_categories: store.categories?.length || 13,
        total_brands: store.brands?.length || 10,
        total_customers: store.customers?.length || 5,
        total_enquiries: enquiries.length,
        new_enquiries: enquiries.filter(e => e.status === 'New').length,
        pending_quotations: enquiries.filter(e => ['New', 'Contacted', 'Quotation Sent', 'Follow-up'].includes(e.status)).length,
        recent: enquiries.slice(0, 8)
      };
    }
  },

  // Products
  async getProducts(search = '') {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      let list = store.products || [];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.hp_rating?.toLowerCase().includes(q)
        );
      }
      return list;
    }
    try {
      const res = await api.get('/admin/products', { params: search ? { q: search } : {} });
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      let list = store.products || [];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.hp_rating?.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  async getProduct(id) {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      const product = store.products?.find(p => p.id === Number(id));
      if (!product) throw new Error('Product not found in local catalog.');
      return product;
    }
    try {
      const res = await api.get(`/admin/products/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      const product = store.products?.find(p => p.id === Number(id));
      if (!product) throw new Error('Product not found in local catalog.');
      return product;
    }
  },

  async saveProduct(payload, id = null) {
    const saveLocally = () => {
      const store = loadLocalStore();
      const cat = store.categories?.find(c => c.id === Number(payload.category_id));
      const sub = store.subcategories?.find(s => s.id === Number(payload.subcategory_id));
      const brandNames = (payload.brandIds || [])
        .map(bid => store.brands?.find(b => b.id === Number(bid))?.name)
        .filter(Boolean)
        .join(', ');

      const toSlug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const brandList = brandNames ? brandNames.split(',').map(s => s.trim()).filter(Boolean) : [];
      const catSlug = cat ? (cat.slug || toSlug(cat.name)) : 'pumps';
      const subSlug = sub ? (sub.slug || toSlug(sub.name)) : '';

      const formattedSpecs = Array.isArray(payload.specifications)
        ? payload.specifications
        : (typeof payload.specifications === 'string' ? JSON.parse(payload.specifications || '[]') : []);

      if (id) {
        const idx = store.products.findIndex(p => p.id === Number(id));
        if (idx !== -1) {
          store.products[idx] = {
            ...store.products[idx],
            ...payload,
            id: Number(id),
            category_name: cat ? cat.name : store.products[idx].category_name,
            category_slug: catSlug,
            subcategory_name: sub ? sub.name : '',
            subcategory_slug: subSlug,
            brands: brandNames || store.products[idx].brands,
            brand_list: brandList.length ? brandList : (store.products[idx].brand_list || []),
            specifications: formattedSpecs,
            updated_at: new Date().toISOString()
          };
        }
        addLocalActivity('product_updated', 'product', id, { name: payload.name });
        saveLocalStore(store);
        return { id: Number(id) };
      } else {
        const newId = Date.now();
        const newProd = {
          ...payload,
          id: newId,
          slug: payload.slug || toSlug(payload.name),
          category_name: cat ? cat.name : 'Pumps',
          category_slug: catSlug,
          subcategory_name: sub ? sub.name : '',
          subcategory_slug: subSlug,
          brands: brandNames,
          brand_list: brandList,
          images: payload.images || [
            { id: Date.now(), image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80', is_primary: true }
          ],
          specifications: formattedSpecs,
          is_active: payload.is_active !== false,
          is_featured: !!payload.is_featured,
          needs_review: false,
          updated_at: new Date().toISOString()
        };
        store.products.unshift(newProd);
        addLocalActivity('product_created', 'product', newId, { name: payload.name });
        saveLocalStore(store);
        return { id: newId };
      }
    };

    if (isLocalFallbackActive()) return saveLocally();
    try {
      if (id) {
        const res = await api.put(`/admin/products/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/products', payload);
        return res.data;
      }
    } catch (err) {
      return saveLocally();
    }
  },

  async deleteProduct(id) {
    const deleteLocally = () => {
      const store = loadLocalStore();
      const p = store.products?.find(item => item.id === Number(id));
      store.products = store.products.filter(item => item.id !== Number(id));
      addLocalActivity('product_deleted', 'product', id, { name: p?.name });
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return deleteLocally();
    try {
      const res = await api.delete(`/admin/products/${id}`);
      return res.data;
    } catch (err) {
      return deleteLocally();
    }
  },

  // Enquiries
  async getEnquiries(status = '') {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      let list = store.enquiries || [];
      if (status) {
        list = list.filter(e => e.status === status);
      }
      return list;
    }
    try {
      const res = await api.get('/admin/enquiries', { params: status ? { status } : {} });
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      let list = store.enquiries || [];
      if (status) {
        list = list.filter(e => e.status === status);
      }
      return list;
    }
  },

  async updateEnquiry(id, data) {
    try {
      const res = await api.patch(`/admin/enquiries/${id}`, data);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      const idx = store.enquiries.findIndex(e => e.id === Number(id));
      if (idx !== -1) {
        const item = store.enquiries[idx];
        if (data.status) item.status = data.status;
        if (data.assigned_admin_id !== undefined) {
          item.assigned_admin_id = data.assigned_admin_id;
          const admin = store.team?.find(a => a.id === Number(data.assigned_admin_id));
          item.assigned_name = admin ? admin.name : 'Unassigned';
        }
        if (data.note) {
          item.notes = item.notes || [];
          item.notes.unshift({
            id: Date.now(),
            admin_name: localStorage.getItem('la_admin_name') || 'Lakshmi Agency Admin',
            note: data.note,
            created_at: new Date().toISOString()
          });
        }
        store.enquiries[idx] = item;
      }
      addLocalActivity('enquiry_updated', 'enquiry', id, { status: data.status, has_note: !!data.note });
      saveLocalStore(store);
      return { success: true };
    }
  },

  async createOfflineEnquiry(enquiryData) {
    const store = loadLocalStore();
    const newRef = `LA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEnquiry = {
      id: Date.now(),
      reference_no: newRef,
      customer_name: enquiryData.customer_name,
      company_name: enquiryData.company_name || '',
      mobile: enquiryData.mobile,
      email: enquiryData.email || '',
      product_name: enquiryData.product_name || 'General Inquiry',
      category_name: enquiryData.category_name || 'Pumps',
      brand_preference: enquiryData.brand_preference || 'Any Leading Brand',
      quantity: enquiryData.quantity || '1 Unit',
      specifications: enquiryData.specifications || '',
      message: enquiryData.message || 'Direct walk-in / phone enquiry registered at Parrys showroom.',
      status: enquiryData.status || 'New',
      assigned_admin_id: 1,
      assigned_name: localStorage.getItem('la_admin_name') || 'Lakshmi Agency Admin',
      created_at: new Date().toISOString(),
      notes: enquiryData.note ? [
        { id: Date.now(), admin_name: localStorage.getItem('la_admin_name') || 'Lakshmi Agency Admin', note: enquiryData.note, created_at: new Date().toISOString() }
      ] : [],
      attachments: []
    };
    store.enquiries.unshift(newEnquiry);
    addLocalActivity('enquiry_created', 'enquiry', newEnquiry.id, { reference_no: newRef, customer: enquiryData.customer_name });
    saveLocalStore(store);
    return newEnquiry;
  },

  async deleteEnquiry(id) {
    try {
      const res = await api.delete(`/admin/enquiries/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      store.enquiries = store.enquiries.filter(e => e.id !== Number(id));
      addLocalActivity('enquiry_deleted', 'enquiry', id);
      saveLocalStore(store);
      return { success: true };
    }
  },

  // Categories & Subcategories
  async getCategories() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.categories || [];
    }
    try {
      const res = await api.get('/admin/categories');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.categories || [];
    }
  },

  async saveCategory(payload, id = null) {
    try {
      if (id) {
        const res = await api.put(`/admin/categories/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/categories', payload);
        return res.data;
      }
    } catch (err) {
      const store = loadLocalStore();
      if (id) {
        const idx = store.categories.findIndex(c => c.id === Number(id));
        if (idx !== -1) {
          store.categories[idx] = { ...store.categories[idx], ...payload, id: Number(id) };
        }
        addLocalActivity('category_updated', 'category', id, { name: payload.name });
      } else {
        const newCat = {
          ...payload,
          id: Date.now(),
          slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          subcategories: [],
          is_active: payload.is_active !== false,
          is_featured: !!payload.is_featured
        };
        store.categories.push(newCat);
        addLocalActivity('category_created', 'category', newCat.id, { name: payload.name });
      }
      saveLocalStore(store);
      return { success: true };
    }
  },

  async deleteCategory(id) {
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      store.categories = store.categories.filter(c => c.id !== Number(id));
      addLocalActivity('category_deleted', 'category', id);
      saveLocalStore(store);
      return { success: true };
    }
  },

  async getSubcategories() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.subcategories || [];
    }
    try {
      const res = await api.get('/admin/subcategories');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.subcategories || [];
    }
  },

  async saveSubcategory(payload, id = null) {
    try {
      if (id) {
        const res = await api.put(`/admin/subcategories/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/subcategories', payload);
        return res.data;
      }
    } catch (err) {
      const store = loadLocalStore();
      const cat = store.categories?.find(c => c.id === Number(payload.category_id));
      if (id) {
        const idx = store.subcategories.findIndex(s => s.id === Number(id));
        if (idx !== -1) {
          store.subcategories[idx] = { ...store.subcategories[idx], ...payload, category_name: cat?.name || '' };
        }
        addLocalActivity('subcategory_updated', 'subcategory', id, { name: payload.name });
      } else {
        const newSub = {
          ...payload,
          id: Date.now(),
          slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category_name: cat?.name || '',
          is_active: true
        };
        store.subcategories.push(newSub);
        // Also add to category
        if (cat) {
          cat.subcategories = cat.subcategories || [];
          cat.subcategories.push(newSub);
        }
        addLocalActivity('subcategory_created', 'subcategory', newSub.id, { name: payload.name });
      }
      saveLocalStore(store);
      return { success: true };
    }
  },

  async deleteSubcategory(id) {
    try {
      const res = await api.delete(`/admin/subcategories/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      store.subcategories = store.subcategories.filter(s => s.id !== Number(id));
      addLocalActivity('subcategory_deleted', 'subcategory', id);
      saveLocalStore(store);
      return { success: true };
    }
  },

  // Brands
  async getBrands() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.brands || [];
    }
    try {
      const res = await api.get('/admin/brands');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.brands || [];
    }
  },

  async saveBrand(payload, id = null) {
    try {
      if (id) {
        const res = await api.put(`/admin/brands/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/brands', payload);
        return res.data;
      }
    } catch (err) {
      const store = loadLocalStore();
      const catIds = Array.isArray(payload.categoryIds) ? payload.categoryIds.join(',') : (payload.category_ids || '');
      if (id) {
        const idx = store.brands.findIndex(b => b.id === Number(id));
        if (idx !== -1) {
          store.brands[idx] = { ...store.brands[idx], ...payload, category_ids: catIds, id: Number(id) };
        }
        addLocalActivity('brand_updated', 'brand', id, { name: payload.name });
      } else {
        const newBrand = {
          ...payload,
          id: Date.now(),
          slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category_ids: catIds,
          is_active: payload.is_active !== false
        };
        store.brands.push(newBrand);
        addLocalActivity('brand_created', 'brand', newBrand.id, { name: payload.name });
      }
      saveLocalStore(store);
      return { success: true };
    }
  },

  async deleteBrand(id) {
    try {
      const res = await api.delete(`/admin/brands/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      store.brands = store.brands.filter(b => b.id !== Number(id));
      addLocalActivity('brand_deleted', 'brand', id);
      saveLocalStore(store);
      return { success: true };
    }
  },

  // Customers
  async getCustomers() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.customers || [];
    }
    try {
      const res = await api.get('/admin/customers');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.customers || [];
    }
  },

  async updateCustomer(id, data) {
    try {
      const res = await api.put(`/admin/customers/${id}`, data);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      const idx = store.customers.findIndex(c => c.id === Number(id));
      if (idx !== -1) {
        store.customers[idx] = { ...store.customers[idx], ...data };
      }
      addLocalActivity('customer_updated', 'customer', id, data);
      saveLocalStore(store);
      return { success: true };
    }
  },

  async deleteCustomer(id) {
    try {
      const res = await api.delete(`/admin/customers/${id}`);
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      const idx = store.customers.findIndex(c => c.id === Number(id));
      if (idx !== -1) {
        store.customers[idx].active = false;
      }
      addLocalActivity('customer_deactivated', 'customer', id);
      saveLocalStore(store);
      return { success: true };
    }
  },

  // Banners
  async getBanners() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.banners || [];
    }
    try {
      const res = await api.get('/admin/banners');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.banners || [];
    }
  },

  async saveBanner(payload, id = null) {
    const saveLocally = () => {
      const store = loadLocalStore();
      if (id) {
        const idx = store.banners.findIndex(b => b.id === Number(id));
        if (idx !== -1) {
          store.banners[idx] = { ...store.banners[idx], ...payload, id: Number(id) };
        }
        addLocalActivity('banner_updated', 'banner', id, { title: payload.title });
      } else {
        const newBanner = {
          ...payload,
          id: Date.now(),
          is_active: payload.is_active !== false,
          display_order: Number(payload.display_order || store.banners.length + 1)
        };
        store.banners.push(newBanner);
        addLocalActivity('banner_created', 'banner', newBanner.id, { title: payload.title });
      }
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return saveLocally();
    try {
      if (id) {
        const res = await api.put(`/admin/banners/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/banners', payload);
        return res.data;
      }
    } catch (err) {
      return saveLocally();
    }
  },

  async deleteBanner(id) {
    const deleteLocally = () => {
      const store = loadLocalStore();
      store.banners = store.banners.filter(b => b.id !== Number(id));
      addLocalActivity('banner_deleted', 'banner', id);
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return deleteLocally();
    try {
      const res = await api.delete(`/admin/banners/${id}`);
      return res.data;
    } catch (err) {
      return deleteLocally();
    }
  },

  // Settings
  async getSettings() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.settings || {};
    }
    try {
      const res = await api.get('/admin/settings');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.settings || {};
    }
  },

  async saveSettings(values) {
    const saveLocally = () => {
      const store = loadLocalStore();
      store.settings = store.settings || {};
      for (const [k, v] of Object.entries(values)) {
        store.settings[k] = {
          value: v,
          is_private: /^(bank_|.*account|.*ifsc)/i.test(k)
        };
      }
      addLocalActivity('settings_updated', 'settings', null, { keys: Object.keys(values) });
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return saveLocally();
    try {
      const res = await api.put('/admin/settings', values);
      return res.data;
    } catch (err) {
      return saveLocally();
    }
  },

  // Team
  async getTeam() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.team || [];
    }
    try {
      const res = await api.get('/admin/team');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.team || [];
    }
  },

  async saveTeamMember(payload, id = null) {
    const saveLocally = () => {
      const store = loadLocalStore();
      if (id) {
        const idx = store.team.findIndex(t => t.id === Number(id));
        if (idx !== -1) {
          store.team[idx] = { ...store.team[idx], ...payload, id: Number(id) };
        }
        addLocalActivity('admin_updated', 'admin', id, { name: payload.name, role: payload.role });
      } else {
        const newMember = {
          id: Date.now(),
          name: payload.name,
          email: payload.email,
          role: payload.role || 'editor',
          active: 1
        };
        store.team.push(newMember);
        addLocalActivity('admin_created', 'admin', newMember.id, { name: payload.name, role: payload.role });
      }
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return saveLocally();
    try {
      if (id) {
        const res = await api.put(`/admin/team/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/admin/team', payload);
        return res.data;
      }
    } catch (err) {
      return saveLocally();
    }
  },

  async deleteTeamMember(id) {
    const deleteLocally = () => {
      const store = loadLocalStore();
      const idx = store.team.findIndex(t => t.id === Number(id));
      if (idx !== -1) {
        store.team[idx].active = 0;
      }
      addLocalActivity('admin_deactivated', 'admin', id);
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return deleteLocally();
    try {
      const res = await api.delete(`/admin/team/${id}`);
      return res.data;
    } catch (err) {
      return deleteLocally();
    }
  },

  // Content
  async getContent() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.content || [];
    }
    try {
      const res = await api.get('/admin/content');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.content || [];
    }
  },

  async saveContent(key, payload) {
    const saveLocally = () => {
      const store = loadLocalStore();
      const idx = store.content.findIndex(c => c.page_key === key);
      if (idx !== -1) {
        store.content[idx] = { ...store.content[idx], ...payload, page_key: key };
      } else {
        store.content.push({ ...payload, page_key: key });
      }
      addLocalActivity('content_updated', 'page', null, { key });
      saveLocalStore(store);
      return { success: true };
    };

    if (isLocalFallbackActive()) return saveLocally();
    try {
      const res = await api.put(`/admin/content/${key}`, payload);
      return res.data;
    } catch (err) {
      return saveLocally();
    }
  },

  // Activity Logs
  async getActivity() {
    if (isLocalFallbackActive()) {
      const store = loadLocalStore();
      return store.activity || [];
    }
    try {
      const res = await api.get('/admin/activity');
      return res.data;
    } catch (err) {
      const store = loadLocalStore();
      return store.activity || [];
    }
  },

  // Review
  async getCatalogueReview() {
    try {
      const res = await api.get('/admin/catalogue-review');
      return res.data;
    } catch (err) {
      return [
        { id: 1, import_batch: 'batch-01', sheet_name: 'Sheet1', row_number: 14, source_data: { A: 'Pumps', B: 'Submersible Pump', C: '0.5 HP - 5 HP' }, review_reason: 'Ambiguous brand reference', imported_product_id: 1, product_name: 'Submersible Borewell Pump 4-Inch 3HP' },
        { id: 2, import_batch: 'batch-01', sheet_name: 'Sheet1', row_number: 48, source_data: { A: 'Motors', B: 'Flour Mill Heavy Duty', C: '3 HP, 5 HP' }, review_reason: 'Category / brand matrix heading', imported_product_id: null, product_name: null }
      ];
    }
  },

  async resolveCatalogueReview(id, resolve) {
    try {
      const res = await api.patch(`/admin/catalogue-review/${id}`, { resolve });
      return res.data;
    } catch (err) {
      addLocalActivity('catalogue_row_reviewed', 'catalogue_import_row', id);
      return { success: true };
    }
  }
};
