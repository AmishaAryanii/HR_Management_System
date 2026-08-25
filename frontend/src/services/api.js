import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        // Only redirect to login if not already there (prevents infinite reload loops)
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/forgot-password') && !window.location.pathname.startsWith('/reset-password')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Employee API
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getLite: () => api.get('/employees/lite'),
  getMyTeam: () => api.get('/employees/my-team'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/employees/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/employees/${id}`),
  updateRole: (id, role) => api.put(`/employees/${id}/role`, { role }),
  getStats: () => api.get('/employees/stats'),
  uploadProfilePhoto: (formData) => api.put('/employees/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSelf: (data) => api.put('/employees/profile', data),
};

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Designation API
export const designationAPI = {
  getAll: (params) => api.get('/designations', { params }),
  getById: (id) => api.get(`/designations/${id}`),
  create: (data) => api.post('/designations', data),
  update: (id, data) => api.put(`/designations/${id}`, data),
  delete: (id) => api.delete(`/designations/${id}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  breakIn: () => api.post('/attendance/break-in'),
  breakOut: () => api.post('/attendance/break-out'),
  getMonthly: (params) => api.get('/attendance/monthly', { params }),
  mark: (data) => api.post('/attendance/mark', data),
};

// Leave API
export const leaveAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  apply: (data) => api.post('/leaves', data),
  approveByManager: (id, comment) => api.put(`/leaves/${id}/approve-manager`, { comment }),
  approveByAdmin: (id, comment) => api.put(`/leaves/${id}/approve-admin`, { comment }),
  reject: (id, comment) => api.put(`/leaves/${id}/reject`, { comment }),
  cancel: (id) => api.put(`/leaves/${id}/cancel`),
  getBalances: (params) => api.get('/leaves/balances', { params }),
};

// Payroll API
export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  process: (data) => api.post('/payroll/process', data),
  approve: (id, data) => api.put(`/payroll/${id}/approve`, data),
  markPaid: (id, data) => api.put(`/payroll/${id}/mark-paid`, data),
  getPayslips: (params) => api.get('/payroll/payslips', { params }),
  getPayslip: (id) => api.get(`/payroll/payslips/${id}`),
  downloadPayslipPDF: (id) => api.get(`/payroll/payslips/${id}/pdf`, { responseType: 'blob' }),
};

// Task API
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, data) => api.put(`/tasks/${id}/status`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Announcement API
export const announcementAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  publish: (id) => api.put(`/announcements/${id}/publish`),
  unpublish: (id) => api.put(`/announcements/${id}/unpublish`),
};

// Document API
export const documentAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (data) => api.post('/documents/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verify: (id, status) => api.put(`/documents/${id}/verify`, { verificationStatus: status }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Recruitment API
export const recruitmentAPI = {
  getJobs: (params) => api.get('/recruitment/jobs', { params }),
  getJob: (id) => api.get(`/recruitment/jobs/${id}`),
  createJob: (data) => api.post('/recruitment/jobs', data),
  updateJob: (id, data) => api.put(`/recruitment/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/recruitment/jobs/${id}`),
  getCandidates: (params) => api.get('/recruitment/candidates', { params }),
  applyCandidate: (data) => api.post('/recruitment/candidates/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCandidateStatus: (id, status) => api.put(`/recruitment/candidates/${id}/status`, { status }),
  getInterviews: (params) => api.get('/recruitment/interviews', { params }),
  scheduleInterview: (data) => api.post('/recruitment/interviews', data),
  updateInterview: (id, data) => api.put(`/recruitment/interviews/${id}`, data),
};

// Performance API
export const performanceAPI = {
  getAll: (params) => api.get('/performance', { params }),
  getById: (id) => api.get(`/performance/${id}`),
  create: (data) => api.post('/performance', data),
  update: (id, data) => api.put(`/performance/${id}`, data),
  getStats: () => api.get('/performance/stats'),
};

// Dashboard API
export const dashboardAPI = {
  getSuperAdmin: () => api.get('/dashboard/super-admin'),
  getAdmin: () => api.get('/dashboard/admin'),
  getManager: () => api.get('/dashboard/manager'),
  getEmployee: () => api.get('/dashboard/employee'),
};

// Company API
export const companyAPI = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data),
  uploadLogo: (formData) => api.post('/company/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Timesheet API
export const timesheetAPI = {
  getAll: (params) => api.get('/timesheets', { params }),
  create: (data) => api.post('/timesheets', data),
  updateStatus: (id, status, comment) => api.put(`/timesheets/${id}/status`, { status, comment }),
  delete: (id) => api.delete(`/timesheets/${id}`),
};

// Report API
export const reportAPI = {
  getOverview: () => api.get('/reports/overview'),
  getEmployees: () => api.get('/reports/employees'),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getLeaves: (params) => api.get('/reports/leaves', { params }),
  getPayroll: (params) => api.get('/reports/payroll', { params }),
  getRecruitment: () => api.get('/reports/recruitment'),
  getPerformance: () => api.get('/reports/performance'),
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
};

export default api;