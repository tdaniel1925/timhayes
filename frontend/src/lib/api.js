// API helper functions

const API_BASE = '/api';

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (refreshResponse.ok) {
        const { access_token } = await refreshResponse.json();
        localStorage.setItem('access_token', access_token);

        // Retry original request
        headers['Authorization'] = `Bearer ${access_token}`;
        return fetch(`${API_BASE}${url}`, { ...options, headers });
      } else {
        // Refresh failed, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
  }

  return response;
}

export const api = {
  getCalls: async (limit = 50, offset = 0) => {
    const response = await fetchWithAuth(`/calls?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  getStats: async () => {
    const response = await fetchWithAuth('/stats');
    return response.json();
  },

  getTenants: async () => {
    const response = await fetchWithAuth('/admin/tenants');
    return response.json();
  },

  updateTenantConfig: async (tenantId, config) => {
    const response = await fetchWithAuth(`/admin/tenant/${tenantId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    return response.json();
  }
};
