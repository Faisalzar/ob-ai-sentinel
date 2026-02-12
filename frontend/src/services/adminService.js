import api, { apiRequest } from './api';

export const adminService = {
    // Stats
    getStats: () => api.get('/admin/stats'),
    getSystemHealth: () => api.get('/admin/system/health'),

    // Users
    getUsers: (skip = 0, limit = 100) => api.get(`/admin/users?skip=${skip}&limit=${limit}`),
    getUser: (id) => api.get(`/admin/users/${id}`),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    forceLogout: (id) => api.post(`/admin/users/${id}/logout`, {}),
    resetMfa: (id) => api.post(`/admin/users/${id}/reset-mfa`, {}),

    // Uploads
    getUploads: (skip = 0, limit = 100, userId = null) => {
        let url = `/admin/uploads?skip=${skip}&limit=${limit}`;
        if (userId) url += `&user_id=${userId}`;
        return api.get(url);
    },
    deleteUpload: (id) => api.delete(`/admin/uploads/${id}`),
    reprocessUpload: (id) => api.post(`/admin/reprocess/${id}`, {}),

    // Alerts
    getAlerts: (skip = 0, limit = 100, userId = null) => {
        let url = `/admin/alerts?skip=${skip}&limit=${limit}`;
        if (userId) url += `&user_id=${userId}`;
        return api.get(url);
    },
    updateAlert: (id, data) => apiRequest(`/admin/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    exportAlerts: () => {
        // Handling CSV export is different as it returns a blob
        // For now we return the URL or handle download in component
        return `${api.API_BASE_URL}/admin/export/alerts`; // This might need auth token if directly used in href
    },

    // Logs
    getAuditLogs: (skip = 0, limit = 100, userId = null, action = null) => {
        let url = `/admin/audit-logs?skip=${skip}&limit=${limit}`;
        if (userId) url += `&user_id=${userId}`;
        if (action) url += `&action=${action}`;
        return api.get(url);
    },
    exportAuditLogs: (ids = []) => {
        let url = `${api.API_BASE_URL}/admin/export/audit-logs`;
        if (ids && ids.length > 0) {
            url += `?ids=${ids.join(',')}`;
        }
        return url;
    },

    // Settings
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),
};
