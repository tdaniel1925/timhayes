import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

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
      <DashboardLayout title="Revenue Dashboard" subtitle="Platform financial overview">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading revenue data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Revenue Dashboard" subtitle="Platform financial overview">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Monthly Recurring Revenue</h3>
                <p className="text-3xl font-bold text-[#2A2A2A]">{formatCurrency(data.mrr)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">MRR</p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Annual Recurring Revenue</h3>
                <p className="text-3xl font-bold text-[#2A2A2A]">{formatCurrency(data.arr)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">ARR</p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Avg Revenue Per User</h3>
                <p className="text-3xl font-bold text-[#2A2A2A]">{formatCurrency(data.arpu)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">ARPU / month</p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Customer Lifetime Value</h3>
                <p className="text-3xl font-bold text-[#2A2A2A]">{formatCurrency(data.ltv)}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">Est. LTV</p>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Growth Rate</h3>
                <p className={`text-3xl font-bold ${data.growth_rate >= 0 ? 'text-[#3F8A84]' : 'text-red-600'}`}>
                  {data.growth_rate >= 0 ? '+' : ''}{data.growth_rate}%
                </p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">This month</p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">New Customers</h3>
                <p className="text-3xl font-bold text-[#2A2A2A]">{data.new_customers_this_month}</p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">
                  {data.new_customers_last_month} last month
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[#2A2A2A]/60 mb-2">Churn Rate</h3>
                <p className={`text-3xl font-bold ${data.churn_rate <= 5 ? 'text-[#3F8A84]' : 'text-red-600'}`}>
                  {data.churn_rate}%
                </p>
                <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">{data.churned_this_month} churned</p>
              </div>
            </div>

            {/* Plan Breakdown */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-6">Revenue by Plan</h2>
              <div className="space-y-4">
                {data.plan_breakdown.map((plan) => (
                  <div key={plan.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-[#2A2A2A] capitalize">{plan.plan}</span>
                        <span className="text-sm text-[#2A2A2A]/60 font-light ml-2">
                          ({plan.customers} customers @ {formatCurrency(plan.price_per_customer)}/mo)
                        </span>
                      </div>
                      <span className="text-lg font-bold text-[#2A2A2A]">
                        {formatCurrency(plan.monthly_revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-[#F9FAFA] rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${plan.percentage}%`, backgroundColor: '#6CA8C2' }}
                      ></div>
                    </div>
                    <p className="text-xs text-[#2A2A2A]/60 font-light mt-1">{plan.percentage}% of MRR</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-6">Revenue Trend (6 Months)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9FAFA] border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Month</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenue_trend.map((month, index) => (
                      <tr key={index} className="border-b border-gray-50">
                        <td className="py-3 px-4 text-sm text-[#2A2A2A]">{month.month}</td>
                        <td className="py-3 px-4 text-sm font-medium text-[#2A2A2A]">
                          {formatCurrency(month.revenue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#2A2A2A]/70 font-light">{month.customers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-bold text-[#2A2A2A] mb-6">Recent Transactions</h2>
              {data.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFA] border-b border-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Tenant</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#2A2A2A]">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]/70 font-light">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]">{transaction.tenant_name}</td>
                          <td className="py-3 px-4 text-sm font-medium text-[#2A2A2A]">
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
                          <td className="py-3 px-4 text-sm text-[#2A2A2A]/70 font-light">{transaction.invoice_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#2A2A2A]/60 font-light text-center py-8">No transactions yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
