import axios from 'axios';
import toast from 'react-hot-toast';

const rawUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/v1';
const normalizedBaseURL = rawUrl.endsWith('/api/v1') 
  ? rawUrl 
  : `${rawUrl.replace(/\/+$/, '')}/api/v1`;

export const api = axios.create({
  baseURL: normalizedBaseURL,
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

export const marketCascadeService = {
  getEvents: (params) => api.get('/market-events', { params }),
  getEventById: (id) => api.get(`/market-events/${id}`),
  getCascade: (id, params) => api.get(`/market-events/${id}/cascade`, { params }),
  getImpact: (id) => api.get(`/market-events/${id}/impact`),
  submitThesisReview: (id, data) => api.post(`/market-events/${id}/thesis-review`, data),
  saveResearchQuestion: (id, data) => api.post(`/market-events/${id}/research-question`, data),
  explainCascade: (id, data) => api.post(`/market-events/${id}/ai-explain`, data)
};

export const scenarioService = {
  getScenarios: () => api.get('/scenarios'),
  getScenarioById: (id) => api.get(`/scenarios/${id}`),
  createScenario: (data) => api.post('/scenarios', data),
  updateScenario: (id, data) => api.patch(`/scenarios/${id}`, data),
  deleteScenario: (id) => api.delete(`/scenarios/${id}`),
  runScenario: (scenarioOrId, options = {}) => {
    if (typeof scenarioOrId === 'string') {
      return api.post(`/scenarios/${scenarioOrId}/run`, options);
    }
    return api.post('/scenarios/run', { scenario: scenarioOrId, ...options });
  },
  compareScenarios: (scenarios, options = {}) => api.post('/scenarios/compare', { scenarios, options }),
  explainScenario: (scenario, options = {}) => api.post('/scenarios/ai-explain', { scenario, options })
};

export const strategyService = {
  getStrategies: () => api.get('/strategies'),
  getStrategyById: (id) => api.get(`/strategies/${id}`),
  createStrategy: (data) => api.post('/strategies', data),
  updateStrategy: (id, data) => api.patch(`/strategies/${id}`, data),
  deleteStrategy: (id) => api.delete(`/strategies/${id}`),
  runBacktest: (strategy, options = {}) => api.post('/strategies/backtest/run', { strategy, options }),
  runOptimization: (strategy, parameterGrid = {}, options = {}) => api.post('/strategies/backtest/optimize', { strategy, parameterGrid, options }),
  runSplitTest: (strategy, trainWindow, testWindow, options = {}) => api.post('/strategies/backtest/split-test', { strategy, trainWindow, testWindow, options }),
  runWalkForward: (strategy, windows = [], options = {}) => api.post('/strategies/backtest/walk-forward', { strategy, windows, options }),
  compareStrategies: (strategyIds, options = {}) => api.post('/strategies/backtest/compare', { strategyIds, options }),
  stressTestStrategy: (strategy, scenarioId) => api.post('/strategies/backtest/stress-test', { strategy, scenarioId }),
  generateResearchQuestion: (backtestResult) => api.post('/strategies/backtest/research-question', { backtestResult }),
  explainBacktest: (backtestResult) => api.post('/strategies/backtest/explain', { backtestResult })
};

export const marketScannerService = {
  getScanners: () => api.get('/scanners'),
  getScannerById: (id) => api.get(`/scanners/${id}`),
  createScanner: (data) => api.post('/scanners', data),
  updateScanner: (id, data) => api.patch(`/scanners/${id}`, data),
  deleteScanner: (id) => api.delete(`/scanners/${id}`),
  runScan: (scanner, options = {}) => api.post('/scanners/run', { scanner, options }),
  getHistory: () => api.get('/scanners/history'),
  backtestScan: (scanner, options = {}) => api.post('/scanners/backtest', { scanner, options }),
  stressTestCandidates: (symbols, scenarioId = 'preset-it-correction') => api.post('/scanners/stress', { symbols, scenarioId }),
  generateResearchQuestion: (scanResult) => api.post('/scanners/research-question', { scanResult }),
  explainScan: (scanResult) => api.post('/scanners/explain', { scanResult })
};

export const researchService = {
  investigate: (data) => api.post('/research/investigate', data),
  compare: (data) => api.post('/research/compare', data),
  deeper: (data) => api.post('/research/deeper', data),
  getSessions: (params) => api.get('/research/sessions', { params }),
  getSessionById: (id) => api.get(`/research/sessions/${id}`),
  updateSession: (id, data) => api.patch(`/research/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/research/sessions/${id}`)
};

export const marketEventsService = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  markRead: (id) => api.patch(`/events/${id}/read`),
  markAllRead: () => api.patch('/events/read-all'),
  evaluate: () => api.post('/events/evaluate')
};

export const insightsService = {
  getToday: () => api.get('/insights/today'),
  getHistory: (params) => api.get('/insights/history', { params }),
  markRead: (id) => api.patch(`/insights/${id}/read`),
  dismiss: (id) => api.patch(`/insights/${id}/dismiss`)
};

export const demoService = {
  getOverview: () => api.get('/demo'),
  seedDemo: () => api.post('/demo/seed'),
};



