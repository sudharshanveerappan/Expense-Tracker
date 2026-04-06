import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired / invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Reload to let AuthContext redirect to /auth
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  getMe:  ()     => api.get('/auth/me'),
};

export const expenseAPI = {
  getAll:       (params) => api.get('/expenses', { params }),
  create:       (data)   => api.post('/expenses', data),
  update:       (id, data) => api.put(`/expenses/${id}`, data),
  delete:       (id)     => api.delete(`/expenses/${id}`),
  getAnalytics: (params) => api.get('/expenses/analytics', { params }),
};

// Fetches current + previous month analytics in one call
export const analyticsAPI = {
  getMonthPair: async (month, year) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const [curr, prev] = await Promise.all([
      api.get('/expenses/analytics', { params: { month, year } }),
      api.get('/expenses/analytics', { params: { month: prevMonth, year: prevYear } }),
    ]);
    return { curr: curr.data, prev: prev.data, prevMonth, prevYear };
  },
  getYear: (year) => api.get('/expenses/analytics', { params: { month: 12, year } }),
};

export const budgetAPI = {
  getAll:  (params) => api.get('/budgets', { params }),
  upsert:  (data)   => api.post('/budgets', data),
  delete:  (id)     => api.delete(`/budgets/${id}`),
};

// Guard against non-http(s) base URLs (SSRF mitigation for the REACT_APP_API_URL env var)
const _base = process.env.REACT_APP_API_URL || '';
if (_base && !new RegExp('^https?://', 'i').test(_base)) {
  console.error('[api] REACT_APP_API_URL must start with http:// or https://');
}

export const chatAPI = {
  health: () => api.get('/chat/health'),
  send:   (message) => api.post('/chat', { message }),
};

export default api;
