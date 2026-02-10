import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RevenueAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/analytics/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalytics(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load revenue analytics');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Revenue Analytics" subtitle="MRR, ARR, and revenue insights">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Revenue Analytics" subtitle="MRR, ARR, and revenue insights">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {analytics && (
          <>
            {/* Current Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* MRR */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Monthly Recurring Revenue</h3>
                  <svg className="w-8 h-8 text-[#3F8A84]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">${analytics.current.mrr.toLocaleString()}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">MRR</p>
              </div>

              {/* ARR */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Annual Recurring Revenue</h3>
                  <svg className="w-8 h-8 text-[#6CA8C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">${analytics.current.arr.toLocaleString()}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">ARR</p>
              </div>

              {/* Active Tenants */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Active Tenants</h3>
                  <svg className="w-8 h-8 text-[#C89A8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{analytics.current.active_tenants}</p>
                <p className="text-sm text-[#3F8A84] font-light mt-1">
                  {analytics.current.trial_tenants} on trial
                </p>
              </div>

              {/* Churn Rate */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Churn Rate</h3>
                  <svg className="w-8 h-8 text-[#E4B756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">{analytics.current.churn_rate}%</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">
                  {analytics.current.churned_tenants} churned
                </p>
              </div>
            </div>

            {/* Revenue by Plan */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-4">Revenue by Plan</h2>
              {analytics.by_plan && analytics.by_plan.length > 0 ? (
                <div className="space-y-4">
                  {analytics.by_plan.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#F9FAFA] rounded-xl">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#2A2A2A]">{item.plan}</h3>
                        <p className="text-sm text-[#2A2A2A]/60 font-light">{item.subscribers} subscribers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#2A2A2A]">${item.revenue.toLocaleString()}</p>
                        <p className="text-sm text-[#2A2A2A]/60 font-light">/month</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#2A2A2A]/60 font-light text-center py-8">No revenue data yet</p>
              )}
            </div>

            {/* Historical Data */}
            {analytics.historical && analytics.historical.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-4">Historical Revenue (Last 30 Days)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">MRR</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">ARR</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Active</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">New Tenants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.historical.slice().reverse().map((metric, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-[#F9FAFA]">
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]">
                            {new Date(metric.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]">
                            ${metric.mrr.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]">
                            ${metric.arr.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]/70 font-light">
                            {metric.active_tenants}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {metric.new_tenants > 0 ? (
                              <span className="text-[#3F8A84]">+{metric.new_tenants}</span>
                            ) : (
                              <span className="text-[#2A2A2A]/60 font-light">{metric.new_tenants}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!analytics.historical || analytics.historical.length === 0) && (
              <div className="glass-card rounded-2xl p-6">
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-[#2A2A2A]/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-serif font-medium text-[#2A2A2A] mb-2">No Historical Data</h3>
                  <p className="text-[#2A2A2A]/60 font-light">Historical revenue metrics will appear here as data accumulates</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
