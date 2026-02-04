import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(response.data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load revenue data');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AudiaPro Super Admin</h1>
                <p className="text-sm text-gray-600">Platform Management Console</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/superadmin/dashboard"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              to="/superadmin/tenants"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Tenants
            </Link>
            <Link
              to="/superadmin/revenue"
              className="px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              Revenue
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Recurring Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.mrr)}</p>
                <p className="text-sm text-gray-500 mt-1">MRR</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Annual Recurring Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.arr)}</p>
                <p className="text-sm text-gray-500 mt-1">ARR</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Revenue Per User</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.arpu)}</p>
                <p className="text-sm text-gray-500 mt-1">ARPU / month</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Customer Lifetime Value</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.ltv)}</p>
                <p className="text-sm text-gray-500 mt-1">Est. LTV</p>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Growth Rate</h3>
                <p className={`text-3xl font-bold ${data.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.growth_rate >= 0 ? '+' : ''}{data.growth_rate}%
                </p>
                <p className="text-sm text-gray-500 mt-1">This month</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">New Customers</h3>
                <p className="text-3xl font-bold text-gray-900">{data.new_customers_this_month}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.new_customers_last_month} last month
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Churn Rate</h3>
                <p className={`text-3xl font-bold ${data.churn_rate <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.churn_rate}%
                </p>
                <p className="text-sm text-gray-500 mt-1">{data.churned_this_month} churned</p>
              </div>
            </div>

            {/* Plan Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue by Plan</h2>
              <div className="space-y-4">
                {data.plan_breakdown.map((plan) => (
                  <div key={plan.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 capitalize">{plan.plan}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({plan.customers} customers @ {formatCurrency(plan.price_per_customer)}/mo)
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(plan.monthly_revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${plan.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.percentage}% of MRR</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (6 Months)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenue_trend.map((month, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{month.month}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {formatCurrency(month.revenue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{month.customers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h2>
              {data.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tenant</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{transaction.tenant_name}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{transaction.invoice_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
