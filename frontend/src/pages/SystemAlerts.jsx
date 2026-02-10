import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SystemAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [showResolved]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/superadmin/alerts?resolved=${showResolved}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlerts(response.data.alerts || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load alerts');
        setLoading(false);
      }
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('superadmin_token');
      await axios.post(
        `${API_URL}/superadmin/alerts/${alertId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'border-[#E4B756]/30';
      case 'info':
        return 'border-[#6CA8C2]/30';
      default:
        return 'border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-[#E4B756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-[#6CA8C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="System Alerts" subtitle="Monitor and resolve system issues">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading alerts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const resolvedAlerts = alerts.filter(a => a.is_resolved);

  return (
    <DashboardLayout title="System Alerts" subtitle="Monitor and resolve system issues">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2A2A2A]/60">Active Alerts</p>
                <p className="text-3xl font-bold text-[#2A2A2A] mt-1">{activeAlerts.length}</p>
              </div>
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2A2A2A]/60">Critical</p>
                <p className="text-3xl font-bold text-[#2A2A2A] mt-1">
                  {activeAlerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <svg className="w-12 h-12 text-[#E4B756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2A2A2A]/60">Resolved Today</p>
                <p className="text-3xl font-bold text-[#2A2A2A] mt-1">
                  {resolvedAlerts.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.resolved_at).toDateString() === today;
                  }).length}
                </p>
              </div>
              <svg className="w-12 h-12 text-[#3F8A84]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-[#2A2A2A]">
            {showResolved ? 'Resolved Alerts' : 'Active Alerts'}
          </h2>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="px-4 py-2 text-sm font-medium text-[#2A2A2A] bg-white border border-gray-300 rounded-full hover:bg-gray-50"
          >
            {showResolved ? 'Show Active' : 'Show Resolved'}
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-card rounded-2xl border p-6 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-serif font-bold text-[#2A2A2A]">{alert.title}</h3>
                      <p className="text-sm text-[#2A2A2A]/70 font-light mt-1">{alert.message}</p>
                    </div>

                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="ml-4 px-3 py-1 text-sm font-medium text-green-700 bg-green-50 border border-green-600 rounded-full hover:bg-green-100"
                      >
                        Resolve
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-[#2A2A2A]/60 font-light mt-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">{alert.alert_type}</span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>

                    {alert.metric_value !== null && alert.threshold_value !== null && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Value: {alert.metric_value} / Threshold: {alert.threshold_value}</span>
                      </div>
                    )}
                  </div>

                  {alert.is_resolved && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-[#2A2A2A]/60 font-light">
                        Resolved {new Date(alert.resolved_at).toLocaleString()}
                        {alert.resolved_by && ` by ${alert.resolved_by}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <svg className="w-16 h-16 text-[#2A2A2A]/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-serif font-medium text-[#2A2A2A] mb-2">
              {showResolved ? 'No Resolved Alerts' : 'No Active Alerts'}
            </h3>
            <p className="text-[#2A2A2A]/60 font-light">
              {showResolved
                ? 'No alerts have been resolved yet'
                : 'All systems operational - no active alerts'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
