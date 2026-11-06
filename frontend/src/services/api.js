import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized / expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('civicpulse_token');
      localStorage.removeItem('civicpulse_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getWorkers: () => api.get('/auth/workers'),
};

export const categoriesService = {
  getAll: () => api.get('/categories'),
};

export const reportsService = {
  submit: (data) => api.post('/reports/submit', data),
  getMyReports: () => api.get('/reports/my-reports'),
  getById: (id) => api.get(`/reports/by-id/${id}`),
  getAll: (params) => api.get('/reports', { params }),
  uploadImage: (formData) => api.post('/reports/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const issuesService = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  verify: (id, data) => api.post(`/issues/${id}/verify`, data),
  mergeDuplicate: (id, data) => api.post(`/issues/${id}/merge`, data),
  reopen: (id, data) => api.post(`/issues/${id}/reopen`, data),
};

export const aiService = {
  classify: (text, image_url) => api.post('/ai/classify', { text, image_url }),
  detectDuplicates: (data) => api.post('/ai/detect-duplicates', data),
  recommendPriority: (data) => api.post('/ai/recommend-priority', data),
};

export const assignmentsService = {
  assign: (data) => api.post('/assignments', data),
  getMyTasks: (params) => api.get('/assignments/my-tasks', { params }),
  updateStatus: (id, data) => api.patch(`/assignments/${id}/status`, data),
};

export const evidenceService = {
  uploadFile: (formData) => api.post('/evidence/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submit: (data) => api.post('/evidence/upload', data),
  getByIssueId: (issueId) => api.get(`/evidence/${issueId}`),
  verify: (evidenceId, data) => api.post(`/evidence/${evidenceId}/verify`, data),
};

export const feedbackService = {
  submit: (data) => api.post('/feedback', data),
  getByIssueId: (issueId) => api.get(`/feedback/${issueId}`),
};

export const notificationsService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const analyticsService = {
  getStats: () => api.get('/admin/analytics'),
};

export default api;

