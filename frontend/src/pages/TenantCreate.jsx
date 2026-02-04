import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TenantCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    subdomain: '',
    plan: 'starter',
    admin_email: '',
    admin_password: '',
    admin_name: '',
    max_users: 5,
    max_calls_per_month: 1000
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subdomainError, setSubdomainError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-generate subdomain from company name
    if (name === 'company_name' && !formData.subdomain) {
      const subdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, subdomain }));
    }

    // Validate subdomain
    if (name === 'subdomain') {
      if (!/^[a-z0-9-]+$/.test(value)) {
        setSubdomainError('Subdomain can only contain lowercase letters, numbers, and hyphens');
      } else {
        setSubdomainError('');
      }
    }

    setError('');
  };

  const handlePlanChange = (plan) => {
    let maxUsers, maxCalls;

    switch (plan) {
      case 'free':
        maxUsers = 2;
        maxCalls = 100;
        break;
      case 'starter':
        maxUsers = 5;
        maxCalls = 1000;
        break;
      case 'professional':
        maxUsers = 20;
        maxCalls = 10000;
        break;
      case 'enterprise':
        maxUsers = 999999;
        maxCalls = 999999;
        break;
      default:
        maxUsers = 5;
        maxCalls = 1000;
    }

    setFormData({
      ...formData,
      plan,
      max_users: maxUsers,
      max_calls_per_month: maxCalls
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (subdomainError) {
      setError('Please fix the subdomain error before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/superadmin/tenants`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success - redirect to tenant detail page
      navigate(`/superadmin/tenants/${response.data.tenant.id}`);
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError(err.response?.data?.error || 'Failed to create tenant. Please try again.');
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
              className="px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              Tenants
            </Link>
            <Link
              to="/superadmin/revenue"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Revenue
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/superadmin/tenants"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tenants
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Tenant</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain * <span className="text-gray-500 text-xs">(used in webhook URL)</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 text-sm mr-2">/api/webhook/cdr/</span>
                    <input
                      type="text"
                      id="subdomain"
                      name="subdomain"
                      required
                      value={formData.subdomain}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        subdomainError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="acme-corp"
                    />
                  </div>
                  {subdomainError && (
                    <p className="mt-1 text-sm text-red-600">{subdomainError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
                </div>
              </div>
            </div>

            {/* Plan & Limits */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan & Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Plan</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['free', 'starter', 'professional', 'enterprise'].map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => handlePlanChange(plan)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all capitalize ${
                          formData.plan === plan
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="max_users" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Users
                  </label>
                  <input
                    type="number"
                    id="max_users"
                    name="max_users"
                    required
                    min="1"
                    value={formData.max_users}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="max_calls_per_month" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Calls/Month
                  </label>
                  <input
                    type="number"
                    id="max_calls_per_month"
                    name="max_calls_per_month"
                    required
                    min="1"
                    value={formData.max_calls_per_month}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Admin User */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="admin_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    id="admin_name"
                    name="admin_name"
                    required
                    value={formData.admin_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    id="admin_email"
                    name="admin_email"
                    required
                    value={formData.admin_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@acme.com"
                  />
                </div>

                <div>
                  <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    id="admin_password"
                    name="admin_password"
                    required
                    minLength="8"
                    value={formData.admin_password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/superadmin/tenants"
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || subdomainError}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
