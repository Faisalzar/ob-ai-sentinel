import API_BASE_URL from './apiConfig';

export const get = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
};

export const post = async (path, body, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
};
