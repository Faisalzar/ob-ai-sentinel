// Use environment variable if provided, otherwise fallback to local dev or same-origin /api/v1
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export default API_BASE_URL;
