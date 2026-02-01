import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (userData) => api.post('/auth/signin', userData),
  getMe: () => api.get('/auth/me'),
};

// Product API calls
export const productAPI = {
  getAll: () => api.get('/products/get'),
  getById: (id) => api.get(`/products/get/${id}`),
  create: (productData) => api.post('/products/add', productData),
  update: (id, productData) => api.put(`/products/update/${id}`, productData),
  delete: (id) => api.delete(`/products/remove/${id}`),
};

// Product Key API calls
export const productKeyAPI = {
  addBulk: (productId, keys, notes) => api.post('/product-keys/add', { productId, keys, notes }),
  addSingle: (productId, key, notes) => api.post('/product-keys/add-single', { productId, key, notes }),
  getAvailable: (productId) => api.get(`/product-keys/${productId}/available`),
  getStats: (productId) => api.get(`/product-keys/${productId}/stats`),
  getAll: (productId, page, limit, filter) =>
    api.get(`/product-keys/${productId}/all?page=${page}&limit=${limit}&filter=${filter}`),
  delete: (keyId) => api.delete(`/product-keys/${keyId}`),
};

// Order API calls
export const orderAPI = {
  create: (productId, stripeSessionId) => api.post('/orders/create', { productId, stripeSessionId }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getMyKeys: () => api.get('/orders/my-keys'),
  getAll: () => api.get('/orders/all'),
  getUserPurchasedProducts: () => api.get('/orders/user/products')
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories/get'),
  create: (data) => api.post('/categories/create', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const guideAPI = {
  getAll: () => api.get('/guides/get'),
  create: (data) => api.post('/guides/create', data),
  update: (id, data) => api.put(`/guides/${id}`, data),
  delete: (id) => api.delete(`/guides/${id}`)
};

export const featureListAPI = {
  get: (productId) => api.get(`/feature-lists/${productId}`),
  create: (data) => api.post('/feature-lists/create', data),
  delete: (productId) => api.delete(`/feature-lists/${productId}`)
};

// Promo Code API
export const promoCodeAPI = {
  getAll: () => api.get('/promo-codes/get'),
  validate: (data) => api.post('/promo-codes/validate', data),
  create: (data) => api.post('/promo-codes/create', data),
  update: (id, data) => api.put(`/promo-codes/${id}`, data),
  delete: (id) => api.delete(`/promo-codes/${id}`),
  incrementUsage: (code) => api.post('/promo-codes/increment-usage', { code })
};

export const userAPI = {
  getAll: () => api.get('/users/get'),
  getOrders: (userId) => api.get(`/users/${userId}/orders`),
  update: (userId, data) => api.put(`/users/${userId}`, data),
  resetPassword: (userId, newPassword) => api.put(`/users/${userId}/password`, { newPassword }),
  delete: (userId) => api.delete(`/users/${userId}`),
  getRevenue: () => api.get('/users/stats/revenue')
};

// Stats API
export const statsAPI = {
  getAllProductStats: () => api.get('/stats/products')
};


export default api;