import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: 'http://localhost:3002/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tradeflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('tradeflow_token');
      localStorage.removeItem('tradeflow_user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.error?.message || 'An unexpected error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export const portfolioService = {
  getHoldings: () => api.get('/portfolio/holdings'),
  getPositions: () => api.get('/portfolio/positions'),
};

export const orderService = {
  placeOrder: (data) => api.post('/orders/new', data),
  getOrders: () => api.get('/orders'),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const accountService = {
  getBalance: () => api.get('/account/balance'),
  getTransactions: () => api.get('/account/transactions'),
};

export const marketService = {
  getQuote: (symbol) => api.get(`/market/quote/${symbol}`),
  getQuotes: () => api.get('/market/quotes'),
  searchSymbols: (query) => api.get(`/market/search?q=${query}`),
};

export const watchlistService = {
  getWatchlist: () => api.get('/watchlist'),
  addSymbol: (symbol) => api.post('/watchlist', { symbol }),
  removeSymbol: (symbol) => api.delete(`/watchlist/${symbol}`),
};

export const alertService = {
  getAlerts: () => api.get('/alerts'),
  createAlert: (data) => api.post('/alerts', data),
  updateAlert: (id, isActive) => api.patch(`/alerts/${id}`, { isActive }),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  evaluateAlerts: () => api.post('/alerts/evaluate'), // Included for test/demo triggers
};

export const journalService = {
  getJournals: () => api.get('/journal'),
  getJournalById: (id) => api.get(`/journal/${id}`),
  updateJournal: (id, data) => api.patch(`/journal/${id}`, data),
  deleteJournal: (id) => api.delete(`/journal/${id}`),
  getReplay: (id) => api.get(`/journal/${id}/replay`),
};

export const aiService = {
  tradeReview: (journalId) => api.get(`/ai/trade-review/${journalId}`),
  portfolioReview: () => api.get('/ai/portfolio-review'),
  patternReview: () => api.get('/ai/pattern-review'),
  dailyDebrief: () => api.get('/ai/daily-debrief'),
  whatChangedToday: () => api.get('/ai/what-changed-today'),
  behaviorReview: (window) => api.get(`/ai/behavior-review?window=${window}`),
  playbookSuggestion: (pattern, desc) => api.post('/ai/playbook-suggestions', { pattern, desc }),
  playbookReview: () => api.get('/ai/playbook-review')
};

export const analyticsService = {
  getBehaviorAnalytics: (window) => api.get(`/analytics/behavior?window=${window}`)
};

export const playbookService = {
  getPlaybooks: () => api.get('/playbooks'),
  getPlaybook: (id) => api.get(`/playbooks/${id}`),
  createPlaybook: (data) => api.post('/playbooks', data),
  updatePlaybook: (id, data) => api.patch(`/playbooks/${id}`, data),
  deletePlaybook: (id) => api.delete(`/playbooks/${id}`)
};
