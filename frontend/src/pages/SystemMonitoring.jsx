import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SystemMonitoring() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/analytics/system`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMetrics(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load system metrics');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="System Monitoring" subtitle="Performance and health metrics">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading system metrics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="System Monitoring" subtitle="Performance and health metrics">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {metrics && (
          <>
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Calls */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Total Calls</h3>
                  <svg className="w-8 h-8 text-[#6CA8C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{metrics.calls.total.toLocaleString()}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">All-time</p>
              </div>

              {/* Calls Today */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Calls Today</h3>
                  <svg className="w-8 h-8 text-[#3F8A84]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{metrics.calls.today.toLocaleString()}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Live activity</p>
              </div>

              {/* Avg Processing Time */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Avg Processing</h3>
                  <svg className="w-8 h-8 text-[#C89A8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{metrics.performance.avg_processing_time.toFixed(1)}s</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Per call</p>
              </div>

              {/* Active Alerts */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Active Alerts</h3>
                  <svg className="w-8 h-8 text-[#E4B756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{metrics.alerts.active}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Unresolved</p>
              </div>
            </div>

            {/* Recent Metrics */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-bold text-[#2A2A2A]">Recent System Metrics (Last 24 Hours)</h2>
                <button
                  onClick={fetchMetrics}
                  className="px-3 py-1 text-sm text-[#3F8A84] hover:text-[#31543A] font-medium border border-[#3F8A84] rounded-full hover:bg-[#3F8A84]/10"
                >
                  Refresh
                </button>
              </div>

              {metrics.recent_metrics && metrics.recent_metrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Timestamp</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Metric Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Value</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recent_metrics.map((metric, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-[#F9FAFA]">
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]/70 font-light">
                            {new Date(metric.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-[#F9FAFA] text-[#2A2A2A] rounded text-xs font-medium">
                              {metric.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-[#2A2A2A]">
                            {metric.value.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]/60 font-light">
                            {metric.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#2A2A2A]/60 font-light text-center py-8">No recent metrics available</p>
              )}
            </div>

            {/* System Status Info */}
            <div className="glass-card rounded-2xl p-6" style={{ backgroundColor: 'rgba(63, 138, 132, 0.1)' }}>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-[#3F8A84] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-serif font-semibold text-[#2A2A2A]">System Operational</h3>
                  <p className="text-sm text-[#2A2A2A]/80 font-light">All systems are running normally. Monitoring refreshes every 30 seconds.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
