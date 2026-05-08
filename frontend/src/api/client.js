/**
 * Axios API client with interceptors for JWT cookie handling.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for 401 handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh/') {
        // Refresh itself failed - force logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh/');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth API ───
export const authAPI = {
  signup: (data) => api.post('/auth/signup/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  refresh: () => api.post('/auth/refresh/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ─── Projects API ───
export const projectsAPI = {
  list: (params) => api.get('/projects/', { params }),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  getMembers: (id) => api.get(`/projects/${id}/members/`),
  addMember: (id, data) => api.post(`/projects/${id}/members/`, data),
  updateMember: (id, memberId, data) => api.patch(`/projects/${id}/members/${memberId}/`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}/`),
  transferOwnership: (id, data) => api.post(`/projects/${id}/transfer-ownership/`, data),
};

// ─── Tasks API ───
export const tasksAPI = {
  list: (projectId, params) => api.get(`/tasks/project/${projectId}/`, { params }),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}/`, data),
  get: (projectId, taskId) => api.get(`/tasks/project/${projectId}/${taskId}/`),
  update: (projectId, taskId, data) => api.patch(`/tasks/project/${projectId}/${taskId}/`, data),
  delete: (projectId, taskId) => api.delete(`/tasks/project/${projectId}/${taskId}/`),
  updateStatus: (projectId, taskId, data) => api.patch(`/tasks/project/${projectId}/${taskId}/status/`, data),
  myTasks: (params) => api.get('/tasks/my-tasks/', { params }),
  dashboard: () => api.get('/tasks/dashboard/'),
};
