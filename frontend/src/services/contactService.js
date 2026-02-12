const API_URL = 'http://localhost:8000/api/v1'; // Adjust if your base URL is different

/**
 * Send a contact message to the backend
 * @param {Object} data - { name, email, organization, subject, message }
 * @returns {Promise<Object>} - Response data
 */
export const sendContactMessage = async (data) => {
    try {
        const response = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw result;
        }

        return result;
    } catch (error) {
        // If the error is from the backend (result), it's thrown as an object.
        // If it's a network error, it might be a standard Error object.
        throw error.detail ? error : { detail: error.message || 'Network error' };
    }
};
