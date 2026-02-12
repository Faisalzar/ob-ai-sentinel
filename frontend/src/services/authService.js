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
    }
};

export default authService;
