// API helper functions with comprehensive error handling

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Export the base URL for use in other components
export const getWebhookBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin + '/api';
  // Remove /api from the end if present
  return apiUrl.replace(/\/api$/, '');
};

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
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data?.access_token) {
            localStorage.setItem('access_token', data.access_token);
            // Retry original request
            headers['Authorization'] = `Bearer ${data.access_token}`;
            return fetch(`${API_BASE}${url}`, { ...options, headers });
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }

      // Refresh failed, logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return response;
}

export const api = {
  getCalls: async (page = 1, perPage = 25, search = '', filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      search: search || ''
    });

    // Add filters if provided
    if (filters.status) params.append('status', filters.status);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.minDuration) params.append('min_duration', filters.minDuration);
    if (filters.maxDuration) params.append('max_duration', filters.maxDuration);

    const response = await fetchWithAuth(`/calls?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch calls');
    }
    return response.json();
  },

  getStats: async () => {
    const response = await fetchWithAuth('/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  getCallVolume: async (days = 30) => {
    const response = await fetchWithAuth(`/analytics/call-volume?days=${days}`);
    if (!response.ok) {
      throw new Error('Failed to fetch call volume');
    }
    return response.json();
  },

  getSentimentTrends: async () => {
    const response = await fetchWithAuth('/analytics/sentiment-trends');
    if (!response.ok) {
      throw new Error('Failed to fetch sentiment trends');
    }
    return response.json();
  },

  getRecording: async (callId) => {
    const response = await fetchWithAuth(`/recording/${callId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recording');
    }

    // Check content type to determine if it's JSON (Supabase URL) or blob (local file)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Backend returned JSON with signed URL (Supabase storage)
      const data = await response.json();
      return { url: data.url, type: data.type || 'supabase' };
    } else {
      // Backend returned blob (legacy local file)
      const blob = await response.blob();
      return { blob, type: 'blob' };
    }
  },

  getPhoneSystems: async () => {
    const response = await fetch(`${API_BASE}/phone-systems`);
    if (!response.ok) {
      throw new Error('Failed to fetch phone systems');
    }
    return response.json();
  },

  getSettings: async () => {
    const response = await fetchWithAuth('/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return response.json();
  },

  updateSettings: async (settings) => {
    const response = await fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }
    return response.json();
  },

  getTenants: async () => {
    const response = await fetchWithAuth('/admin/tenants');
    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }
    return response.json();
  },

  updateTenantConfig: async (tenantId, config) => {
    const response = await fetchWithAuth(`/admin/tenant/${tenantId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      throw new Error('Failed to update tenant config');
    }
    return response.json();
  },

  // Call Detail
  getCallDetail: async (callId) => {
    const response = await fetchWithAuth(`/calls/${callId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch call details');
    }
    return response.json();
  },

  // AI Summary
  getAISummary: async (callId) => {
    const response = await fetchWithAuth(`/calls/${callId}/ai-summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch AI summary');
    }
    return response.json();
  },

  // Activity Logs
  getActivityLogs: async (page = 1, perPage = 50) => {
    const response = await fetchWithAuth(`/activity-logs?page=${page}&per_page=${perPage}`);
    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }
    return response.json();
  },

  // Notifications
  getNotifications: async (page = 1, unreadOnly = false) => {
    const response = await fetchWithAuth(`/notifications?page=${page}&unread=${unreadOnly}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  markNotificationRead: async (notificationId) => {
    const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    return response.json();
  },

  getNotificationRules: async () => {
    const response = await fetchWithAuth('/notifications/rules');
    if (!response.ok) {
      throw new Error('Failed to fetch notification rules');
    }
    return response.json();
  },

  createNotificationRule: async (rule) => {
    const response = await fetchWithAuth('/notifications/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
    if (!response.ok) {
      throw new Error('Failed to create notification rule');
    }
    return response.json();
  },

  // Admin - Setup Requests
  getSetupRequests: async (status = 'all', page = 1) => {
    const response = await fetchWithAuth(`/admin/setup-requests?status=${status}&page=${page}`);
    if (!response.ok) {
      throw new Error('Failed to fetch setup requests');
    }
    return response.json();
  },

  getSetupRequestDetail: async (id) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}/detail`);
    if (!response.ok) {
      throw new Error('Failed to fetch setup request details');
    }
    return response.json();
  },

  updateSetupRequest: async (id, data) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update setup request');
    }
    return response.json();
  },

  activateSetupRequest: async (id) => {
    const response = await fetchWithAuth(`/admin/setup-requests/${id}/activate`, {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to activate setup request');
    }
    return response.json();
  },

  // User Management
  getUsers: async () => {
    const response = await fetchWithAuth('/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  createUser: async (userData) => {
    const response = await fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  updateUser: async (userId, updates) => {
    const response = await fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (userId) => {
    const response = await fetchWithAuth(`/users/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    return response.json();
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await fetchWithAuth(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword })
    });
    if (!response.ok) {
      throw new Error('Failed to reset user password');
    }
    return response.json();
  },

  // Export and Reporting
  exportCallsCSV: async (search = '', filters = {}) => {
    const params = new URLSearchParams({ search: search || '' });

    // Add filters if provided
    if (filters.status) params.append('status', filters.status);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.minDuration) params.append('min_duration', filters.minDuration);
    if (filters.maxDuration) params.append('max_duration', filters.maxDuration);

    const response = await fetchWithAuth(`/export/calls/csv?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export calls');
    }
    return response.blob();
  },

  emailReport: async (email, search = '', filters = {}) => {
    const response = await fetchWithAuth('/export/email-report', {
      method: 'POST',
      body: JSON.stringify({
        email,
        search,
        filters
      })
    });
    if (!response.ok) {
      throw new Error('Failed to send email report');
    }
    return response.json();
  },

  // Password Reset
  requestPasswordReset: async (email) => {
    const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }
    return response.json();
  },

  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }
    return response.json();
  },

  // Email Verification
  verifyEmail: async (token) => {
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    return response.json();
  },

  // Subscription Management
  getSubscription: async () => {
    const response = await fetchWithAuth('/subscription');
    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }
    return response.json();
  },

  getBillingHistory: async () => {
    const response = await fetchWithAuth('/billing/history');
    if (!response.ok) {
      throw new Error('Failed to fetch billing history');
    }
    return response.json();
  },

  getUsageStats: async () => {
    const response = await fetchWithAuth('/usage/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch usage stats');
    }
    return response.json();
  },

  cancelSubscription: async () => {
    const response = await fetchWithAuth('/subscription/cancel', {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }
    return response.json();
  }
};
