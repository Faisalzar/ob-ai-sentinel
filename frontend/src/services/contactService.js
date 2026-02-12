import api from './api';

/**
 * Send a contact message to the backend
 * @param {Object} data - { name, email, organization, subject, message }
 * @returns {Promise<Object>} - Response data
 */
export const sendContactMessage = async (data) => {
    try {
        return await api.post('/contact', data);
    } catch (error) {
        throw error;
    }
};
