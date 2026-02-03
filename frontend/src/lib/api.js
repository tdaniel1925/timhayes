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
  getCalls: async (page = 1, perPage = 25, search = '') => {
    const response = await fetchWithAuth(`/calls?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`);
    return response.json();
  },

  getStats: async () => {
    const response = await fetchWithAuth('/stats');
    return response.json();
  },

  getCallVolume: async (days = 30) => {
    const response = await fetchWithAuth(`/analytics/call-volume?days=${days}`);
    return response.json();
  },

  getSentimentTrends: async () => {
    const response = await fetchWithAuth('/analytics/sentiment-trends');
    return response.json();
  },

  getRecording: async (callId) => {
    const response = await fetchWithAuth(`/recording/${callId}`);
    return response.blob();
  },

  getPhoneSystems: async () => {
    const response = await fetch(`${API_BASE}/phone-systems`);
    return response.json();
  },

  getSettings: async () => {
    const response = await fetchWithAuth('/settings');
    return response.json();
  },

  updateSettings: async (settings) => {
    const response = await fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
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
  },

  // Call Detail
  getCallDetail: async (callId) => {
    const response = await fetchWithAuth(`/calls/${callId}`);
    return response.json();
  },

  // Notifications
  getNotifications: async (page = 1, unreadOnly = false) => {
    const response = await fetchWithAuth(`/notifications?page=${page}&unread=${unreadOnly}`);
    return response.json();
  },

  markNotificationRead: async (notificationId) => {
    const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    return response.json();
  },

  getNotificationRules: async () => {
    const response = await fetchWithAuth('/notifications/rules');
    return response.json();
  },

  createNotificationRule: async (rule) => {
    const response = await fetchWithAuth('/notifications/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
    return response.json();
  },

  // Admin - Setup Requests
  getSetupRequests: async (status = 'all', page = 1) => {
    const response = await fetchWithAuth(`/admin/setup-requests?status=${status}&page=${page}`);
    return response.json();
  },

  getSetupRequestDetail: async (id) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}/detail`);
    return response.json();
  },

  updateSetupRequest: async (id, data) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  activateSetupRequest: async (id) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}/activate`, {
      method: 'POST'
    });
    return response.json();
  }
};
