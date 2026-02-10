/**
 * User-friendly error messages
 * Replace technical/alarming messages with gentle, reassuring ones
 */

export const friendlyErrors = {
  // Data loading
  loadCalls: 'No calls available yet',
  loadCallDetails: 'Unable to retrieve call details at the moment',
  loadUsers: 'No team members to display yet',
  loadSettings: 'Settings are temporarily unavailable',
  loadNotifications: 'No notifications to display',
  loadReports: 'No reports available yet',
  loadDashboard: 'Dashboard data is temporarily unavailable',
  loadTenants: 'No accounts to display yet',
  loadRevenue: 'Revenue data is temporarily unavailable',
  loadCompliance: 'Compliance data is temporarily unavailable',
  loadCosts: 'Cost data is temporarily unavailable',
  loadFeatureFlags: 'Feature settings are temporarily unavailable',
  loadPlans: 'No subscription plans available yet',
  loadUsage: 'Usage data is temporarily unavailable',
  loadPerformance: 'Performance data is temporarily unavailable',
  loadAnalytics: 'Analytics are temporarily unavailable',
  loadAlerts: 'No alerts to display',
  loadIntegrations: 'Integration data is temporarily unavailable',
  loadPrompt: 'Prompt settings are temporarily unavailable',
  loadScenarios: 'No scenarios available yet',
  loadSubscription: 'Subscription information is temporarily unavailable',
  loadTeam: 'Team information is temporarily unavailable',
  loadSystemMetrics: 'System metrics are temporarily unavailable',
  loadStatistics: 'Statistics are temporarily unavailable',
  loadSetupRequests: 'No setup requests to display yet',
  loadAPIInfo: 'API information is temporarily unavailable',

  // AI features
  loadAISummary: 'AI summary is not available yet',
  loadTranscription: 'Transcription is not available yet',
  loadSentiment: 'Sentiment analysis is not available yet',

  // Generic fallback
  generic: 'We\'re having trouble loading this information right now',

  // Network issues
  network: 'Please check your internet connection',
  timeout: 'This is taking longer than expected',

  // Permissions
  unauthorized: 'You don\'t have access to this feature yet',
  forbidden: 'This feature is not available on your current plan',
};

/**
 * Get a friendly error message based on the context
 * @param {string} context - The context (e.g., 'loadCalls', 'loadUsers')
 * @param {Error} error - The original error object (optional)
 * @returns {string} A user-friendly error message
 */
export function getFriendlyError(context, error = null) {
  // Check for specific HTTP status codes
  if (error) {
    if (error.response?.status === 401) {
      return friendlyErrors.unauthorized;
    }
    if (error.response?.status === 403) {
      return friendlyErrors.forbidden;
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return friendlyErrors.timeout;
    }
    if (error.message?.includes('Network') || error.message?.includes('network')) {
      return friendlyErrors.network;
    }
  }

  // Return context-specific message or generic fallback
  return friendlyErrors[context] || friendlyErrors.generic;
}

/**
 * Format an empty state message
 * @param {string} resourceType - Type of resource (e.g., 'calls', 'users')
 * @returns {object} Title and description for empty state
 */
export function getEmptyState(resourceType) {
  const states = {
    calls: {
      title: 'No calls yet',
      description: 'Your call history will appear here once you start receiving calls'
    },
    users: {
      title: 'No team members yet',
      description: 'Invite team members to start collaborating'
    },
    notifications: {
      title: 'No notifications',
      description: 'You\'re all caught up!'
    },
    reports: {
      title: 'No reports yet',
      description: 'Create your first report to get started'
    },
    tenants: {
      title: 'No accounts yet',
      description: 'Create your first client account to get started'
    },
    alerts: {
      title: 'No alerts',
      description: 'Everything is running smoothly'
    },
    setupRequests: {
      title: 'No setup requests',
      description: 'New setup requests will appear here'
    },
  };

  return states[resourceType] || {
    title: 'Nothing here yet',
    description: 'Check back later'
  };
}
