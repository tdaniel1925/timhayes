import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FeatureFlagsManagement() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/superadmin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/superadmin/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFlags(response.data.flags || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching flags:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login');
      } else {
        setError('Failed to load feature flags');
        setLoading(false);
      }
    }
  };

  const handleCreateFlag = () => {
    setEditingFlag({
      name: '',
      description: '',
      is_enabled: false,
      rollout_percentage: 0,
      target_plan_ids: [],
      target_tenant_ids: []
    });
    setShowCreateModal(true);
  };

  const handleEditFlag = (flag) => {
    setEditingFlag(flag);
    setShowCreateModal(true);
  };

  const handleSaveFlag = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');

      if (editingFlag.id) {
        // Update existing flag
        await axios.put(
          `${API_URL}/superadmin/feature-flags/${editingFlag.id}`,
          editingFlag,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new flag
        await axios.post(
          `${API_URL}/superadmin/feature-flags`,
          editingFlag,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowCreateModal(false);
      setEditingFlag(null);
      fetchFlags();
    } catch (err) {
      console.error('Error saving flag:', err);
      setError(err.response?.data?.error || 'Failed to save feature flag');
    }
  };

  const handleToggleFlag = async (flag) => {
    try {
      const token = localStorage.getItem('superadmin_token');
      await axios.put(
        `${API_URL}/superadmin/feature-flags/${flag.id}`,
        { ...flag, is_enabled: !flag.is_enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchFlags();
    } catch (err) {
      console.error('Error toggling flag:', err);
      setError('Failed to toggle feature flag');
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
          <p className="mt-4 text-gray-600">Loading feature flags...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
                <p className="text-sm text-gray-600">Gradual rollouts and A/B testing</p>
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
            <Link to="/superadmin/dashboard" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Dashboard</Link>
            <Link to="/superadmin/tenants" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Tenants</Link>
            <Link to="/superadmin/plans" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Plans & Pricing</Link>
            <Link to="/superadmin/revenue" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Revenue</Link>
            <Link to="/superadmin/costs" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Cost Tracking</Link>
            <Link to="/superadmin/monitoring" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Monitoring</Link>
            <Link to="/superadmin/feature-flags" className="px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap">Feature Flags</Link>
            <Link to="/superadmin/alerts" className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Alerts</Link>
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
            <h2 className="text-2xl font-bold text-gray-900">Feature Flags</h2>
            <p className="text-sm text-gray-600 mt-1">{flags.length} {flags.length === 1 ? 'flag' : 'flags'} configured</p>
          </div>
          <button
            onClick={handleCreateFlag}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Feature Flag
          </button>
        </div>

        {/* Flags List */}
        <div className="space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{flag.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      flag.is_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flag.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {flag.description && (
                    <p className="text-sm text-gray-600 mb-3">{flag.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>Rollout: {flag.rollout_percentage}%</span>
                    </div>

                    {flag.target_plan_ids && flag.target_plan_ids.length > 0 && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{flag.target_plan_ids.length} plans targeted</span>
                      </div>
                    )}

                    {flag.target_tenant_ids && flag.target_tenant_ids.length > 0 && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{flag.target_tenant_ids.length} tenants targeted</span>
                      </div>
                    )}
                  </div>

                  {/* Rollout Progress Bar */}
                  {flag.rollout_percentage > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            flag.is_enabled ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                          style={{ width: `${flag.rollout_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-6">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleFlag(flag)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleEditFlag(flag)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {flags.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feature Flags</h3>
            <p className="text-gray-600 mb-4">Create feature flags to control gradual rollouts and A/B testing</p>
            <button
              onClick={handleCreateFlag}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Create First Flag
            </button>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && editingFlag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingFlag.id ? 'Edit Feature Flag' : 'Create Feature Flag'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flag Name *</label>
                <input
                  type="text"
                  value={editingFlag.name}
                  onChange={(e) => setEditingFlag({ ...editingFlag, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., New Dashboard UI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingFlag.description || ''}
                  onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="What does this flag control?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollout Percentage: {editingFlag.rollout_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editingFlag.rollout_percentage}
                  onChange={(e) => setEditingFlag({ ...editingFlag, rollout_percentage: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingFlag.is_enabled}
                  onChange={(e) => setEditingFlag({ ...editingFlag, is_enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable this flag</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingFlag(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFlag}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingFlag.id ? 'Update Flag' : 'Create Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
