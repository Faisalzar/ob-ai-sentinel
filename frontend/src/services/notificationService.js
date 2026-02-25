import api from './api';

export const notificationService = {
    // Get user notifications
    getNotifications: (skip = 0, limit = 50, unreadOnly = false) => {
        let url = `/notifications?skip=${skip}&limit=${limit}`;
        if (unreadOnly) url += `&unread_only=true`;
        return api.get(url);
    },

    // Mark a single notification as read/unread
    markAsRead: (id, isRead = true) =>
        api.put(`/notifications/${id}/read`, { is_read: isRead }, { method: 'PATCH' }),

    // Mark all as read
    markAllAsRead: () => api.post('/notifications/mark-all-read', {}),

    // Reply to notification
    replyToNotification: (id, message) => api.post(`/notifications/${id}/reply`, { message })
};
