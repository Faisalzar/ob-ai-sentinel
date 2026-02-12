// Use environment variable if provided, otherwise check hostname or fallback to local
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 1. Explicit Fallback for Production (if env var fails)
if (!API_BASE_URL && window.location.hostname.includes('vercel.app')) {
    API_BASE_URL = 'https://ob-ai-backend.onrender.com/api/v1';
}

// 2. Default to Localhost
if (!API_BASE_URL) {
    API_BASE_URL = 'http://localhost:8000/api/v1';
}

console.log('🔌 API Configuration:', {
    detected_url: API_BASE_URL,
    env_var: process.env.REACT_APP_API_BASE_URL,
    hostname: window.location.hostname
});

export default API_BASE_URL;
