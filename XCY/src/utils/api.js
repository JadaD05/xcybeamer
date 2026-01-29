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
};

export default api;