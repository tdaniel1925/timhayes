import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SuperAdminLayout from '@/components/SuperAdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TenantDetail() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // AI Features state
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchTenant();
    fetchFeatures();
  }, [tenantId]);

  const fetchTenant = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTenant(response.data);
      setFormData({
        company_name: response.data.company_name,
        plan: response.data.plan,
        status: response.data.status,
        max_users: response.data.max_users,
        max_calls_per_month: response.data.max_calls_per_month
      });
    } catch (err) {
      console.error('Error fetching tenant:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load tenant');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    setFeaturesLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token');
      const response = await axios.get(`${API_URL}/superadmin/tenants/${tenantId}/features`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFeatures(response.data.features || []);

      // Auto-expand categories that have enabled features
      const expanded = {};
      response.data.features?.forEach(f => {
        if (f.is_enabled) {
          expanded[f.category] = true;
        }
      });
      setExpandedCategories(expanded);
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const toggleFeature = (featureId) => {
    setFeatures(features.map(f =>
      f.feature_id === featureId
        ? { ...f, is_enabled: !f.is_enabled }
        : f
    ));
  };

  const updateFeaturePrice = (featureId, field, value) => {
    setFeatures(features.map(f =>
      f.feature_id === featureId
        ? { ...f, [field]: parseFloat(value) || 0 }
        : f
    ));
  };

  const saveFeatures = async () => {
    setFeaturesSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('superadmin_token');

      // Format features for API
      const featureUpdates = features.map(f => ({
        feature_id: f.feature_id,
        enabled: f.is_enabled,
        custom_monthly_price: f.monthly_price !== f.default_monthly_price ? f.monthly_price : null,
        custom_setup_fee: f.setup_fee !== f.default_setup_fee ? f.setup_fee : null
      }));

      await axios.post(
        `${API_URL}/superadmin/tenants/${tenantId}/features`,
        { features: featureUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh features
      await fetchFeatures();
      alert('Features updated successfully!');
    } catch (err) {
      console.error('Error saving features:', err);
      setError(err.response?.data?.error || 'Failed to save features');
    } finally {
      setFeaturesSaving(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('superadmin_token');
      await axios.put(
        `${API_URL}/superadmin/tenants/${tenantId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditing(false);
      fetchTenant();
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError(err.response?.data?.error || 'Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      const response = await axios.post(
        `${API_URL}/superadmin/tenants/${tenantId}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('impersonated_tenant_name', response.data.user.tenant.company_name);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error impersonating tenant:', err);
      setError('Failed to impersonate tenant');
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Tenant not found</p>
          <Link to="/superadmin/tenants" className="text-blue-600 hover:text-blue-700 mt-4">
            Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout title={`Tenant: ${tenant?.company_name || 'Loading...'}`} subtitle="Manage tenant details and configuration">
      <div className="max-w-7xl mx-auto px-8 py-8">
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

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tenant Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tenant.company_name}</h2>
              <p className="text-sm text-gray-600">Tenant ID: {tenant.id}</p>
            </div>
            <div className="flex items-center space-x-3">
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleImpersonate}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Impersonate
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        company_name: tenant.company_name,
                        plan: tenant.plan,
                        status: tenant.status,
                        max_users: tenant.max_users,
                        max_calls_per_month: tenant.max_calls_per_month
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
                <input
                  type="number"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Calls/Month</label>
                <input
                  type="number"
                  name="max_calls_per_month"
                  value={formData.max_calls_per_month}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subdomain</p>
                <p className="font-medium text-gray-900">{tenant.subdomain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {tenant.plan}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  tenant.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : tenant.status === 'trial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Max Users</p>
                <p className="font-medium text-gray-900">{tenant.max_users}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Max Calls/Month</p>
                <p className="font-medium text-gray-900">{tenant.max_calls_per_month.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{tenant.users?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Calls</h3>
            <p className="text-3xl font-bold text-gray-900">{tenant.call_stats?.total || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Calls This Month</h3>
            <p className="text-3xl font-bold text-gray-900">{tenant.call_stats?.this_month || 0}</p>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Users</h3>
          {tenant.users && tenant.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{user.full_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No users yet</p>
          )}
        </div>

        {/* AI Features Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Features & Pricing</h3>
              <p className="text-sm text-gray-600 mt-1">Configure which AI features are enabled for this tenant</p>
            </div>
            <button
              onClick={saveFeatures}
              disabled={featuresSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {featuresSaving ? 'Saving...' : 'Save Feature Changes'}
            </button>
          </div>

          {featuresLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading features...</p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Total Monthly Cost</h4>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      ${features.filter(f => f.is_enabled).reduce((sum, f) => sum + (f.monthly_price || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Enabled Features</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {features.filter(f => f.is_enabled).length} / {features.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features by Category */}
              {['coaching', 'compliance', 'revenue', 'insights', 'customer_intelligence', 'real_time', 'analytics', 'multilingual', 'integration'].map(category => {
                const categoryFeatures = features.filter(f => f.category === category);
                if (categoryFeatures.length === 0) return null;

                const categoryNames = {
                  'coaching': 'Call Quality & Coaching',
                  'compliance': 'Compliance & Risk Management',
                  'revenue': 'Revenue Intelligence',
                  'insights': 'Automated Insights',
                  'customer_intelligence': 'Customer Intelligence',
                  'real_time': 'Real-Time AI',
                  'analytics': 'Advanced Analytics',
                  'multilingual': 'Multilingual & Global',
                  'integration': 'Integration Intelligence'
                };

                const isExpanded = expandedCategories[category];
                const enabledCount = categoryFeatures.filter(f => f.is_enabled).length;

                return (
                  <div key={category} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg
                          className={`w-5 h-5 mr-2 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <h4 className="font-semibold text-gray-900">{categoryNames[category]}</h4>
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {enabledCount} enabled
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ${categoryFeatures.filter(f => f.is_enabled).reduce((sum, f) => sum + (f.monthly_price || 0), 0).toFixed(2)}/mo
                      </div>
                    </div>

                    {/* Category Features */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {categoryFeatures.map(feature => (
                          <div key={feature.feature_id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start">
                              {/* Enable/Disable Toggle */}
                              <div className="flex items-center h-6 mr-4">
                                <input
                                  type="checkbox"
                                  checked={feature.is_enabled}
                                  onChange={() => toggleFeature(feature.feature_id)}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </div>

                              {/* Feature Info */}
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                  {feature.is_beta && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                      BETA
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{feature.description}</p>

                                {/* Pricing Inputs */}
                                {feature.is_enabled && (
                                  <div className="flex items-center space-x-4 mt-3">
                                    <div className="flex items-center">
                                      <label className="text-xs text-gray-600 mr-2">Monthly Price:</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={feature.monthly_price || 0}
                                          onChange={(e) => updateFeaturePrice(feature.feature_id, 'monthly_price', e.target.value)}
                                          className="pl-6 pr-3 py-1 w-28 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      {feature.monthly_price !== feature.default_monthly_price && (
                                        <span className="ml-2 text-xs text-blue-600">
                                          (default: ${feature.default_monthly_price})
                                        </span>
                                      )}
                                    </div>

                                    {feature.default_setup_fee > 0 && (
                                      <div className="flex items-center">
                                        <label className="text-xs text-gray-600 mr-2">Setup Fee:</label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={feature.setup_fee || 0}
                                            onChange={(e) => updateFeaturePrice(feature.feature_id, 'setup_fee', e.target.value)}
                                            className="pl-6 pr-3 py-1 w-28 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          />
                                        </div>
                                        {feature.setup_fee !== feature.default_setup_fee && (
                                          <span className="ml-2 text-xs text-blue-600">
                                            (default: ${feature.default_setup_fee})
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {feature.usage_count > 0 && (
                                      <div className="text-xs text-gray-500">
                                        Used {feature.usage_count} times
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
