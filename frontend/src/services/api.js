import API_BASE_URL from './apiConfig';

/**
 * API utility that automatically includes authentication token
 */

const getAuthHeaders = () => {
  const auth = localStorage.getItem('auth');
  if (!auth) return {};

  try {
    const { token } = JSON.parse(auth);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText, data);
    // Handle 401 Unauthorized globally, but exclude specific logic error messages like "Invalid password"
    if (response.status === 401) {
      const isTokenIssue = !data.detail ||
        (data.detail !== 'Invalid password' &&
          data.detail !== 'Invalid credentials' &&
          !data.detail.includes('Invalid MFA') &&
          !data.detail.includes('Invalid or expired session') &&
          !data.detail.includes('session expired'));

      if (isTokenIssue) {
        localStorage.removeItem('auth');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    let errorMessage = 'Request failed';
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        // Handle FastAPI validation errors (array of objects)
        errorMessage = data.detail.map(err => err.msg).join(', ');
      } else if (typeof data.detail === 'object') {
        errorMessage = JSON.stringify(data.detail);
      } else {
        errorMessage = data.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return data;
};

export const uploadFile = async (endpoint, formData) => {
  const auth = localStorage.getItem('auth');
  const headers = {};

  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch { }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Upload failed');
  }

  return data;
};

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  uploadFile,
};

export default api;
