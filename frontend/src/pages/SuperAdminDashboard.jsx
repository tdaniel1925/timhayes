import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, Users, Phone, TrendingUp } from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_refresh_token');
    localStorage.removeItem('superadmin_user');
    navigate('/superadmin/login');
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Dashboard" subtitle="Platform-wide statistics and overview">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#31543A] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/60 font-light">Loading dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform-wide statistics and overview">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Statistics</h3>
                <p className="text-sm font-light text-red-700">{error}</p>
                <p className="text-xs font-light text-red-600 mt-2">
                  This could be due to missing database tables or a backend issue. Please check the logs.
                </p>
              </div>
              <button
                onClick={fetchStats}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Tenants */}
              <div className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Total Tenants</h3>
                  <Building2 className="w-8 h-8 text-[#31543A]" />
                </div>
                <p className="text-3xl font-serif text-[#2A2A2A]">{stats.total_tenants}</p>
                <p className="text-sm font-light text-[#3F8A84] mt-1">{stats.active_tenants} active</p>
              </div>

              {/* Total Users */}
              <div className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Total Users</h3>
                  <Users className="w-8 h-8 text-[#6CA8C2]" />
                </div>
                <p className="text-3xl font-serif text-[#2A2A2A]">{stats.total_users}</p>
                <p className="text-sm font-light text-[#2A2A2A]/60 mt-1">Platform-wide</p>
              </div>

              {/* Total Calls */}
              <div className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Total Calls</h3>
                  <Phone className="w-8 h-8 text-[#3F8A84]" />
                </div>
                <p className="text-3xl font-serif text-[#2A2A2A]">{stats.total_calls.toLocaleString()}</p>
                <p className="text-sm font-light text-[#6CA8C2] mt-1">{stats.calls_this_month.toLocaleString()} this month</p>
              </div>

              {/* Calls Today */}
              <div className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#2A2A2A]/60">Calls Today</h3>
                  <TrendingUp className="w-8 h-8 text-[#E4B756]" />
                </div>
                <p className="text-3xl font-serif text-[#2A2A2A]">{stats.calls_today.toLocaleString()}</p>
                <p className="text-sm font-light text-[#2A2A2A]/60 mt-1">Live activity</p>
              </div>
            </div>

            {/* Recent Tenants */}
            <div className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-serif text-[#31543A] mb-4">Recent Tenants</h2>
              {stats.recent_tenants && stats.recent_tenants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#2A2A2A]/70">Company</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#2A2A2A]/70">Subdomain</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#2A2A2A]/70">Plan</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#2A2A2A]/70">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#2A2A2A]/70">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_tenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-gray-100 hover:bg-[#F9FAFA]">
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]">{tenant.company_name}</td>
                          <td className="py-3 px-4 text-sm font-light text-[#2A2A2A]/70">{tenant.subdomain}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-3 py-1 bg-[#6CA8C2]/10 text-[#6CA8C2] rounded-full text-xs font-medium">
                              {tenant.plan}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              tenant.status === 'active'
                                ? 'bg-[#3F8A84]/10 text-[#3F8A84]'
                                : 'bg-gray-100 text-[#2A2A2A]/60'
                            }`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-light text-[#2A2A2A]/70">
                            {new Date(tenant.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="font-light text-[#2A2A2A]/60 text-center py-8">No tenants yet</p>
              )}

              <div className="mt-4 text-center">
                <Link
                  to="/superadmin/tenants"
                  className="text-[#31543A] hover:text-[#3F8A84] font-medium text-sm"
                >
                  View all tenants
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
