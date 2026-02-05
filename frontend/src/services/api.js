import axios from 'axios';

const API_BASE_URL = 'https://dns-hackathon-backend.azurewebsites.net/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (fullName, email, password) => api.post('/auth/signup', { fullName, email, password }),
  me: () => api.get('/auth/me'),
  updateTheme: (theme) => api.put('/auth/theme', { theme }),
};

// Farmer API
export const farmerAPI = {
  getProfile: () => api.get('/farmer/profile'),
  updateLocation: (locationName, latitude, longitude) => 
    api.put('/farmer/location', { locationName, latitude, longitude }),
  addCrop: (cropId, weightKg, harvestDate) => 
    api.post('/farmer/crops', { cropId, weightKg, harvestDate }),
  getCrops: () => api.get('/farmer/crops'),
  deleteCrop: (id) => api.delete(`/farmer/crops/${id}`),
  getProfitSummary: (period, startDate, endDate) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/farmer/profit?${params.toString()}`);
  },
};

// Markets API
export const marketsAPI = {
  getAll: () => api.get('/markets'),
  getTop: (cropId) => {
    const params = cropId ? `?cropId=${cropId}` : '';
    return api.get(`/markets/top${params}`);
  },
  getDetails: (id) => api.get(`/markets/${id}`),
  getPriceHistory: (marketId, cropId, period) => {
    const params = new URLSearchParams();
    if (cropId) params.append('cropId', cropId);
    if (period) params.append('period', period);
    return api.get(`/markets/${marketId}/prices?${params.toString()}`);
  },
  getDemands: () => api.get('/markets/demands'),
};

// Analyze API
export const analyzeAPI = {
  analyze: (farmerLat, farmerLon, crops) => 
    api.post('/analyze', { farmerLat, farmerLon, crops }),
  confirmMarket: (data) => api.post('/analyze/confirm', data),
  getConfirmed: () => api.get('/analyze/confirmed'),
  completeTransaction: (id, actualProfit) => 
    api.put(`/analyze/confirmed/${id}/complete`, { actualProfit }),
  cancelConfirmed: (id) => api.delete(`/analyze/confirmed/${id}`),
};

// Crops API
export const cropsAPI = {
  getAll: (category) => {
    const params = category ? `?category=${category}` : '';
    return api.get(`/crops${params}`);
  },
  getCategories: () => api.get('/crops/categories'),
  search: (q) => api.get(`/crops/search?q=${encodeURIComponent(q)}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly) => {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return api.get(`/notifications${params}`);
  },
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
