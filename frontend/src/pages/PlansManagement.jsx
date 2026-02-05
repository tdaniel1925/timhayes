import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PlansManagement() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlans(response.data.plans || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching plans:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load plans');
        setLoading(false);
      }
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan({
      name: '',
      description: '',
      monthly_price: 0,
      annual_price: 0,
      setup_fee: 0,
      max_calls_per_month: 100,
      max_users: 5,
      max_storage_gb: 10,
      max_recording_minutes: 1000,
      trial_days: 14,
      has_api_access: false,
      has_white_label: false,
      has_priority_support: false,
      is_active: true,
      is_public: true,
      sort_order: plans.length
    });
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleSavePlan = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');

      if (editingPlan.id) {
        // Update existing plan
        await axios.put(
          `${API_URL}/superadmin/plans/${editingPlan.id}`,
          editingPlan,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new plan
        await axios.post(
          `${API_URL}/superadmin/plans`,
          editingPlan,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowCreateModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.response?.data?.error || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('superadmin_token');
      await axios.delete(`${API_URL}/superadmin/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError(err.response?.data?.error || 'Failed to delete plan');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    navigate('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Plans & Pricing</h1>
                <p className="text-sm text-gray-600">Manage subscription plans</p>
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
          <div className="flex space-x-8 overflow-x-auto">
            <Link to="/superadmin/dashboard" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Dashboard
            </Link>
            <Link to="/superadmin/tenants" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Tenants
            </Link>
            <Link to="/superadmin/plans" className="px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap">
              Plans & Pricing
            </Link>
            <Link to="/superadmin/revenue" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Revenue
            </Link>
            <Link to="/superadmin/costs" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Cost Tracking
            </Link>
            <Link to="/superadmin/monitoring" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Monitoring
            </Link>
            <Link to="/superadmin/feature-flags" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Feature Flags
            </Link>
            <Link to="/superadmin/alerts" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Alerts
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

        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing Plans</h2>
            <p className="text-sm text-gray-600 mt-1">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} configured</p>
          </div>
          <button
            onClick={handleCreatePlan}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Plan
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Plan Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-blue-100 text-sm mt-1">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">${plan.monthly_price}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                {plan.annual_price && (
                  <p className="text-sm text-green-600 mt-1">
                    ${plan.annual_price}/year (save {Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100)}%)
                  </p>
                )}
                {plan.setup_fee > 0 && (
                  <p className="text-sm text-gray-600 mt-1">Setup fee: ${plan.setup_fee}</p>
                )}
              </div>

              {/* Features/Limits */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{plan.max_calls_per_month.toLocaleString()} calls/month</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Up to {plan.max_users} users</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{plan.max_storage_gb}GB storage</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{plan.max_recording_minutes} recording mins</span>
                </div>
                {plan.has_api_access && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">API Access</span>
                  </div>
                )}
                {plan.has_white_label && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">White Label</span>
                  </div>
                )}
                {plan.has_priority_support && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Priority Support</span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {plan.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                  )}
                  {plan.is_public && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Public</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans Created</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first pricing plan</p>
            <button
              onClick={handleCreatePlan}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Create Plan
            </button>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPlan.id ? 'Edit Plan' : 'Create New Plan'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Professional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Plan description..."
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
                  <input
                    type="number"
                    value={editingPlan.annual_price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setup Fee ($)</label>
                  <input
                    type="number"
                    value={editingPlan.setup_fee}
                    onChange={(e) => setEditingPlan({ ...editingPlan, setup_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calls per Month</label>
                  <input
                    type="number"
                    value={editingPlan.max_calls_per_month}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_calls_per_month: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                  <input
                    type="number"
                    value={editingPlan.max_users}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_users: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={editingPlan.max_storage_gb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_storage_gb: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recording Minutes</label>
                  <input
                    type="number"
                    value={editingPlan.max_recording_minutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_recording_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.has_api_access}
                    onChange={(e) => setEditingPlan({ ...editingPlan, has_api_access: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">API Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.has_white_label}
                    onChange={(e) => setEditingPlan({ ...editingPlan, has_white_label: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">White Label</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.has_priority_support}
                    onChange={(e) => setEditingPlan({ ...editingPlan, has_priority_support: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Priority Support</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_public}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Shown on Pricing Page</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingPlan.id ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
