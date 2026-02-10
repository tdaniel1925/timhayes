import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SuperAdminLayout from '@/components/SuperAdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CostTracking() {
  const navigate = useNavigate();
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/analytics/costs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching costs:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load cost data');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Cost Tracking" subtitle="OpenAI spend and margins">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading cost data...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Cost Tracking" subtitle="OpenAI spend and margins">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {costs && (
          <>
            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* All-Time Costs */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">All-Time Costs</h3>
                  <svg className="w-8 h-8 text-[#2A2A2A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">${costs.totals.all_time.toFixed(2)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Total OpenAI spend</p>
              </div>

              {/* This Month */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">This Month</h3>
                  <svg className="w-8 h-8 text-[#E4B756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">${costs.totals.this_month.toFixed(2)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Current month spend</p>
              </div>

              {/* Average per Call */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Avg per Call</h3>
                  <svg className="w-8 h-8 text-[#6CA8C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#2A2A2A]">${costs.totals.avg_per_call.toFixed(4)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Cost per call</p>
              </div>
            </div>

            {/* Cost by Tenant */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-4">Top 10 Tenants by Cost</h2>
              {costs.by_tenant && costs.by_tenant.length > 0 ? (
                <div className="space-y-3">
                  {costs.by_tenant.map((tenant, index) => {
                    const maxCost = costs.by_tenant[0]?.cost || 1;
                    const percentage = (tenant.cost / maxCost) * 100;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-[#2A2A2A]">{tenant.tenant}</span>
                              <span className="text-sm text-[#2A2A2A]/60 font-light">{tenant.calls} calls</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-[#F9FAFA] rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%`, backgroundColor: '#E4B756' }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-6 text-right min-w-[80px]">
                            <p className="text-lg font-bold text-[#2A2A2A]">${tenant.cost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#2A2A2A]/60 font-light text-center py-8">No cost data available yet</p>
              )}
            </div>

            {/* Cost Breakdown Info */}
            <div className="glass-card rounded-2xl p-6" style={{ backgroundColor: 'rgba(111, 168, 194, 0.1)' }}>
              <h3 className="font-serif font-semibold text-[#2A2A2A] mb-2">About Cost Tracking</h3>
              <p className="text-sm text-[#2A2A2A]/80 font-light">
                Costs are calculated based on OpenAI API usage for transcription (Whisper) and AI analysis (GPT-4).
                These metrics help you understand your operational expenses per tenant and maintain healthy margins.
              </p>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
