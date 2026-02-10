import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SuperAdminLayout from '@/components/SuperAdminLayout';

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
        await axios.put(
          `${API_URL}/superadmin/plans/${editingPlan.id}`,
          editingPlan,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
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

  if (loading) {
    return (
      <SuperAdminLayout title="Plans & Pricing" subtitle="Manage subscription plans">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#31543A] mx-auto"></div>
            <p className="mt-4 font-light text-[#2A2A2A]/60">Loading plans...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Plans & Pricing" subtitle="Manage subscription plans">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-light text-red-800">{error}</p>
          </div>
        )}

        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-[#31543A]">Pricing Plans</h2>
            <p className="text-sm font-light text-[#2A2A2A]/60 mt-1">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} configured</p>
          </div>
          <button
            onClick={handleCreatePlan}
            className="px-4 py-2 bg-[#31543A] text-white font-medium rounded-full hover:bg-[#3F8A84] transition-colors"
          >
            Create New Plan
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="glass-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Plan Header */}
              <div className="bg-gradient-to-br from-[#31543A] to-[#3F8A84] px-6 py-4">
                <h3 className="text-xl font-serif text-white">{plan.name}</h3>
                <p className="text-white/80 text-sm font-light mt-1">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-baseline">
                  <span className="text-4xl font-serif text-[#2A2A2A]">${plan.monthly_price}</span>
                  <span className="font-light text-[#2A2A2A]/60 ml-2">/month</span>
                </div>
                {plan.annual_price && (
                  <p className="text-sm font-light text-[#3F8A84] mt-1">
                    ${plan.annual_price}/year (save {Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100)}%)
                  </p>
                )}
                {plan.setup_fee > 0 && (
                  <p className="text-sm font-light text-[#2A2A2A]/60 mt-1">Setup fee: ${plan.setup_fee}</p>
                )}
              </div>

              {/* Features/Limits */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-light text-[#2A2A2A]">{plan.max_calls_per_month.toLocaleString()} calls/month</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-light text-[#2A2A2A]">Up to {plan.max_users} users</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-light text-[#2A2A2A]">{plan.max_storage_gb}GB storage</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-light text-[#2A2A2A]">{plan.max_recording_minutes} recording mins</span>
                </div>
                {plan.has_api_access && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-light text-[#2A2A2A]">API Access</span>
                  </div>
                )}
                {plan.has_white_label && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-light text-[#2A2A2A]">White Label</span>
                  </div>
                )}
                {plan.has_priority_support && (
                  <div className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-[#3F8A84] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-light text-[#2A2A2A]">Priority Support</span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="px-6 py-3 bg-[#F9FAFA] border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-2">
                  {plan.is_active && (
                    <span className="px-3 py-1 bg-[#3F8A84]/10 text-[#3F8A84] text-xs font-medium rounded-full">Active</span>
                  )}
                  {plan.is_public && (
                    <span className="px-3 py-1 bg-[#6CA8C2]/10 text-[#6CA8C2] text-xs font-medium rounded-full">Public</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="text-[#31543A] hover:text-[#3F8A84] text-sm font-medium"
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
          <div className="text-center py-12 glass-card bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-16 h-16 text-[#2A2A2A]/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">No Plans Created</h3>
            <p className="font-light text-[#2A2A2A]/60 mb-4">Get started by creating your first pricing plan</p>
            <button
              onClick={handleCreatePlan}
              className="px-4 py-2 bg-[#31543A] text-white font-medium rounded-full hover:bg-[#3F8A84]"
            >
              Create Plan
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-serif text-[#31543A]">
                {editingPlan.id ? 'Edit Plan' : 'Create New Plan'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  placeholder="e.g., Professional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Description</label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent font-light"
                  rows="2"
                  placeholder="Plan description..."
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Annual Price ($)</label>
                  <input
                    type="number"
                    value={editingPlan.annual_price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Setup Fee ($)</label>
                  <input
                    type="number"
                    value={editingPlan.setup_fee}
                    onChange={(e) => setEditingPlan({ ...editingPlan, setup_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Calls per Month</label>
                  <input
                    type="number"
                    value={editingPlan.max_calls_per_month}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_calls_per_month: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Max Users</label>
                  <input
                    type="number"
                    value={editingPlan.max_users}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_users: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={editingPlan.max_storage_gb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_storage_gb: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-1">Recording Minutes</label>
                  <input
                    type="number"
                    value={editingPlan.max_recording_minutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_recording_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31543A] focus:border-transparent"
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
                    className="rounded border-gray-300 text-[#31543A] focus:ring-[#31543A]"
                  />
                  <span className="ml-2 text-sm font-light text-[#2A2A2A]">API Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.has_white_label}
                    onChange={(e) => setEditingPlan({ ...editingPlan, has_white_label: e.target.checked })}
                    className="rounded border-gray-300 text-[#31543A] focus:ring-[#31543A]"
                  />
                  <span className="ml-2 text-sm font-light text-[#2A2A2A]">White Label</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.has_priority_support}
                    onChange={(e) => setEditingPlan({ ...editingPlan, has_priority_support: e.target.checked })}
                    className="rounded border-gray-300 text-[#31543A] focus:ring-[#31543A]"
                  />
                  <span className="ml-2 text-sm font-light text-[#2A2A2A]">Priority Support</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-[#31543A] focus:ring-[#31543A]"
                  />
                  <span className="ml-2 text-sm font-light text-[#2A2A2A]">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_public}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                    className="rounded border-gray-300 text-[#31543A] focus:ring-[#31543A]"
                  />
                  <span className="ml-2 text-sm font-light text-[#2A2A2A]">Shown on Pricing Page</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F9FAFA] border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#2A2A2A] bg-white border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 text-sm font-medium text-white bg-[#31543A] rounded-full hover:bg-[#3F8A84]"
              >
                {editingPlan.id ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
