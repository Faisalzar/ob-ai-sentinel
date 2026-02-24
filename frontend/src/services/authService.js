import api from './api';

export const authService = {
    /**
     * Login with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>} TokenResponse
     */
    login: async (email, password) => {
        return await api.post('/auth/login', { email, password });
    },

    /**
     * Verify MFA TOTP code
     * @param {string} mfaToken - The temporary token received from login
     * @param {string} code - The 6-digit TOTP code
     * @returns {Promise<Object>} TokenResponse
     */
    verifyMfa: async (mfaToken, code) => {
        return await api.post('/auth/verify-mfa', { mfa_token: mfaToken, token: code });
    },

    /**
     * Send Email OTP (for non-MFA users or verification)
     * @param {string} email 
     * @returns {Promise<Object>} { message: string }
     */
    sendEmailOtp: async (email) => {
        return await api.post('/auth/send-email-otp', { email });
    },

    /**
     * Verify Email OTP
     * @param {string} email 
     * @param {string} code 
     * @returns {Promise<Object>} { message: string }
     */
    verifyEmailOtp: async (email, code) => {
        return await api.post('/auth/verify-email-otp', { email, otp_code: code });
    },

    /**
     * Register a new user
     * @param {Object} userData - { name, email, password }
     * @returns {Promise<Object>} Response data
     */
    register: async (userData) => {
        return await api.post('/auth/register', userData);
    },

    /**
     * Request password reset
     * @param {string} email 
     * @returns {Promise<Object>} Response data
     */
    requestPasswordReset: async (email) => {
        return await api.post('/auth/request-password-reset', { email });
    },

    /**
     * Verify password reset OTP
     * @param {string} email 
     * @param {string} otp 
     * @returns {Promise<Object>} { message: string, reset_token: string }
     */
    verifyPasswordResetOtp: async (email, otp) => {
        return await api.post('/auth/verify-password-reset-otp', { email, otp });
    },

    /**
     * Complete password reset
     * @param {string} token - The reset token from verify step
     * @param {string} newPassword 
     * @returns {Promise<Object>} Response data
     */
    resetPassword: async (token, newPassword) => {
        return await api.post('/auth/reset-password', { token, new_password: newPassword });
    }
};

export default authService;
