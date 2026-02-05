import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PromptScenarios() {
  const { getAuthHeader } = useAuth();
  const [scenariosByFeature, setScenariosByFeature] = useState({});
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [refinementResult, setRefinementResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/prompts/scenarios`, {
        headers: getAuthHeader()
      });
      setScenariosByFeature(response.data.scenarios_by_feature || {});
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
      setError('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScenario = async (scenarioId, featureSlug) => {
    setApplying(scenarioId);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/prompts/scenarios/${scenarioId}/apply`,
        {},
        { headers: getAuthHeader() }
      );

      setRefinementResult(response.data);
      setSelectedScenario(response.data.scenario);
      setSuccess('Scenario applied successfully! Review the changes below.');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply scenario');
      console.error('Scenario application failed:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleConfirmApplication = async () => {
    if (!refinementResult) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/prompts/copilot/apply`,
        {
          feature_slug: refinementResult.scenario.feature_slug,
          refined_prompt: refinementResult.refined_prompt,
          changes_summary: refinementResult.changes_summary
        },
        { headers: getAuthHeader() }
      );

      setSuccess('Prompt activated! Your AI feature will now use this optimized prompt.');
      setRefinementResult(null);
      setSelectedScenario(null);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate prompt');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'sensitivity', 'emphasis', 'strictness', 'focus', 'calibration', 'tracking', 'detection', 'style'];
  const features = ['all', ...Object.keys(scenariosByFeature)];

  const filteredScenarios = Object.entries(scenariosByFeature).reduce((acc, [featureSlug, scenarios]) => {
    if (selectedFeature !== 'all' && featureSlug !== selectedFeature) return acc;

    const filtered = scenarios.filter(scenario =>
      selectedCategory === 'all' || scenario.category === selectedCategory
    );

    if (filtered.length > 0) {
      acc[featureSlug] = filtered;
    }

    return acc;
  }, {});

  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quick Scenario Library</h1>
              <p className="text-gray-600 mt-1">Apply pre-built optimizations with one click</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start">
            <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-indigo-800">
              Browse 60+ pre-built optimization scenarios. Click any scenario to preview the changes, then activate with one click.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Feature</label>
              <select
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {features.map(feature => (
                  <option key={feature} value={feature}>
                    {feature === 'all' ? 'All Features' : feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
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

        {/* Refinement Preview Modal */}
        {refinementResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedScenario?.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedScenario?.feature_slug.replace(/-/g, ' ').toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setRefinementResult(null);
                      setSelectedScenario(null);
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
                {/* Changes Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What Changed</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">{refinementResult.changes_summary}</p>
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{refinementResult.explanation}</p>
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Confidence</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${refinementResult.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-4 text-lg font-semibold text-gray-900">
                      {Math.round(refinementResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setRefinementResult(null);
                    setSelectedScenario(null);
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApplication}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Activate This Prompt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scenarios Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : Object.keys(filteredScenarios).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scenarios Found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredScenarios).map(([featureSlug, scenarios]) => (
              <div key={featureSlug} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {featureSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm">{scenario.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${impactColors[scenario.impact]}`}>
                          {scenario.impact}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mb-3">{scenario.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {scenario.category}
                        </span>

                        <button
                          onClick={() => handleApplyScenario(scenario.id, featureSlug)}
                          disabled={applying === scenario.id}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                        >
                          {applying === scenario.id ? 'Applying...' : 'Apply →'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
