import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PromptPerformance() {
  const { getAuthHeader } = useAuth();
  const [overview, setOverview] = useState(null);
  const [optimizationOpportunities, setOptimizationOpportunities] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [featureDetails, setFeatureDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API_URL}/prompts/performance/overview`, {
        headers: getAuthHeader()
      });
      setOverview(response.data);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureDetails = async (featureSlug) => {
    try {
      const response = await axios.get(`${API_URL}/prompts/performance/feature/${featureSlug}`, {
        headers: getAuthHeader()
      });
      setFeatureDetails(response.data);
      setSelectedFeature(featureSlug);
    } catch (err) {
      console.error('Failed to fetch feature details:', err);
    }
  };

  const analyzeOptimizations = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_URL}/prompts/auto-optimize/analyze`,
        {},
        { headers: getAuthHeader() }
      );
      setOptimizationOpportunities(response.data.recommendations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze optimizations');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoOptimize = async (featureSlug, autoApply = false) => {
    setOptimizing(featureSlug);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/prompts/auto-optimize/apply`,
        {
          feature_slug: featureSlug,
          auto_apply: autoApply
        },
        { headers: getAuthHeader() }
      );

      if (autoApply) {
        setSuccess(`Optimization applied to ${featureSlug}!`);
      } else {
        setSuccess('Optimization generated! Review and apply if desired.');
      }

      // Refresh overview
      fetchOverview();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to optimize prompt');
    } finally {
      setOptimizing(null);
    }
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Prompt Performance</h1>
                <p className="text-gray-600 mt-1">Monitor usage and discover optimization opportunities</p>
              </div>
            </div>

            <button
              onClick={analyzeOptimizations}
              disabled={analyzing}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Find Optimizations
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{overview.overview.total_features}</div>
                  <div className="text-sm text-gray-600 mt-1">AI Features</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{overview.overview.total_usage.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Usage</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{overview.overview.custom_prompts_active}</div>
                  <div className="text-sm text-gray-600 mt-1">Custom Prompts Active</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{overview.overview.default_prompts_in_use}</div>
                  <div className="text-sm text-gray-600 mt-1">Using Default Prompts</div>
                </div>
              </div>
            )}

            {/* Optimization Opportunities */}
            {optimizationOpportunities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Optimization Opportunities</h2>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                      {optimizationOpportunities.filter(o => o.priority === 'critical').length} Critical
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-medium">
                      {optimizationOpportunities.filter(o => o.priority === 'high').length} High
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {optimizationOpportunities.map((opp, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-gray-900">{opp.feature_name}</h3>
                            <span className={`ml-3 px-2 py-1 text-xs font-medium rounded border ${priorityColors[opp.priority]}`}>
                              {opp.priority}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {opp.current_source} prompt
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{opp.reason}</p>
                          <div className="text-xs text-gray-600 mb-3">
                            <strong>Expected Impact:</strong> {opp.estimated_impact}
                          </div>

                          {opp.suggested_improvements && opp.suggested_improvements.length > 0 && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                              <div className="text-xs font-semibold text-blue-900 mb-2">Suggested Improvements:</div>
                              <ul className="text-xs text-blue-800 space-y-1">
                                {opp.suggested_improvements.map((improvement, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <div className="text-right mb-2">
                            <div className="text-xs text-gray-600">Confidence</div>
                            <div className="text-lg font-bold text-gray-900">{Math.round(opp.confidence * 100)}%</div>
                          </div>
                          <button
                            onClick={() => handleAutoOptimize(opp.feature_slug, true)}
                            disabled={optimizing === opp.feature_slug}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {optimizing === opp.feature_slug ? 'Optimizing...' : 'Auto-Optimize'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Performance Table */}
            {overview && overview.features && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Feature Performance</h2>
                  <p className="text-sm text-gray-600 mt-1">Click any feature to see detailed analytics</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Feature</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Prompt Source</th>
                        <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Usage Count</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Last Used</th>
                        <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overview.features.map((feature) => (
                        <tr key={feature.feature_slug} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{feature.feature_name}</div>
                            <div className="text-xs text-gray-500">{feature.feature_slug}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              feature.prompt_source === 'custom'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {feature.prompt_source}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-sm font-semibold text-gray-900">{feature.usage_count.toLocaleString()}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600">
                              {feature.last_used ? new Date(feature.last_used).toLocaleDateString() : 'Never'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => fetchFeatureDetails(feature.feature_slug)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Feature Details Modal */}
        {featureDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{featureDetails.feature_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">Detailed performance analytics</p>
                  </div>
                  <button
                    onClick={() => {
                      setFeatureDetails(null);
                      setSelectedFeature(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Prompt Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Prompt</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Source</div>
                        <div className="font-medium text-gray-900">{featureDetails.current_prompt.source}</div>
                      </div>
                      {featureDetails.current_prompt.last_updated && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Last Updated</div>
                          <div className="font-medium text-gray-900">
                            {new Date(featureDetails.current_prompt.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-900">{featureDetails.usage_statistics.total_usage}</div>
                      <div className="text-sm text-blue-700">Total Uses</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-900">{featureDetails.usage_statistics.last_30_days}</div>
                      <div className="text-sm text-purple-700">Uses (Last 30 Days)</div>
                    </div>
                  </div>
                </div>

                {/* Prompt History */}
                {featureDetails.prompt_history && featureDetails.prompt_history.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Prompt History</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="space-y-2">
                        {featureDetails.prompt_history.map((history, index) => (
                          <div key={history.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Version {featureDetails.prompt_history.length - index}
                              </div>
                              <div className="text-xs text-gray-600">
                                Updated: {new Date(history.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            {history.is_active && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
