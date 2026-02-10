import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PromptSettings() {
  const { getAuthHeader } = useAuth();
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptSource, setPromptSource] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get(`${API_URL}/prompts/features`, {
        headers: getAuthHeader()
      });
      setFeatures(response.data.features || []);
    } catch (err) {
      console.error('Failed to fetch features:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureSelect = async (feature) => {
    setSelectedFeature(feature);
    setError('');
    setSuccess('');
    setAnalysis(null);
    setLoading(true);

    try {
      const response = await axios.get(`${API_URL}/prompts/defaults`, {
        headers: getAuthHeader(),
        params: { feature: feature.slug }
      });

      setCurrentPrompt(response.data.prompt || '');
      setPromptSource(response.data.industry === 'generic' ? 'default' : 'industry');

    } catch (err) {
      setError('Failed to load prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePrompt = async () => {
    if (!selectedFeature) return;

    setAnalyzing(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/prompts/analyze-and-suggest`,
        {
          feature_slug: selectedFeature.slug,
          current_prompt: currentPrompt
        },
        { headers: getAuthHeader() }
      );

      setAnalysis(response.data.analysis);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze prompt');
    } finally {
      setAnalyzing(false);
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout
      title="Prompt Settings"
      subtitle="View and manage your AI prompts"
    >
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-end space-x-3 mb-6">
            <Link
              to="/prompts/copilot"
              className="px-4 py-2 text-sm font-medium text-[#2A2A2A] bg-[#F9FAFA] border border-[#F9FAFA] rounded-full hover:bg-[#6CA8C2]/10 font-serif font-light"
            >
              Open Copilot
            </Link>
            <Link
              to="/prompts/scenarios"
              className="px-4 py-2 text-sm font-medium text-[#2A2A2A] bg-[#F9FAFA] border border-[#F9FAFA] rounded-full hover:bg-[#6CA8C2]/10 font-serif font-light"
            >
              Browse Scenarios
            </Link>
            <Link
              to="/prompts/performance"
              className="px-4 py-2 text-sm font-medium text-[#2A2A2A] bg-[#F9FAFA] border border-[#F9FAFA] rounded-full hover:bg-[#6CA8C2]/10 font-serif font-light"
            >
              View Performance
            </Link>
          </div>

          {/* Info Banner */}
          <div className="bg-[#F9FAFA] border border-[#2A2A2A]/10 rounded-2xl p-4 flex items-start">
            <svg className="w-5 h-5 text-[#2A2A2A]/60 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-[#2A2A2A]/80 font-serif font-light">
              <strong className="font-medium">Advanced Mode:</strong> You can view prompts here, but we recommend using the Copilot or Scenarios for making changes. Direct prompt editing is available if you enable Advanced Mode.
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-800 font-serif font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-green-800 font-serif font-light">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Feature List */}
          <div className="col-span-4">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-serif font-light text-[#2A2A2A] mb-4">AI Features</h2>

              {loading && !selectedFeature ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F8A84]"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {features.map((feature) => (
                    <button
                      key={feature.slug}
                      onClick={() => handleFeatureSelect(feature)}
                      className={`w-full text-left px-4 py-3 rounded-full transition-all font-serif font-light ${
                        selectedFeature?.slug === feature.slug
                          ? 'bg-[#31543A] text-white shadow-md'
                          : 'bg-[#F9FAFA] text-[#2A2A2A] hover:bg-[#6CA8C2]/10'
                      }`}
                    >
                      <div className="font-medium">{feature.name}</div>
                      <div className={`text-xs mt-1 ${
                        selectedFeature?.slug === feature.slug ? 'text-white/80' : 'text-[#2A2A2A]/60'
                      }`}>
                        {feature.industry_count} industry variants
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Viewer */}
          <div className="col-span-8">
            {!selectedFeature ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Feature</h3>
                <p className="text-gray-600">Choose a feature from the left to view its prompt</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedFeature.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">Current prompt configuration</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg font-medium">
                        {promptSource} prompt
                      </span>
                      <button
                        onClick={handleAnalyzePrompt}
                        disabled={analyzing}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {analyzing ? 'Analyzing...' : 'Analyze Quality'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAdvanced}
                        onChange={(e) => setShowAdvanced(e.target.checked)}
                        className="mr-2 rounded"
                      />
                      Show Advanced Mode (view raw prompt)
                    </label>
                  </div>
                </div>

                {/* Prompt Content */}
                <div className="p-6">
                  {showAdvanced ? (
                    <div>
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {currentPrompt}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        This is the raw prompt text. For best results, use the Copilot or Scenarios to make changes instead of editing directly.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt Active</h3>
                      <p className="text-gray-600 mb-6">This feature is using a {promptSource} prompt optimized for your needs.</p>
                      <div className="flex justify-center space-x-3">
                        <Link
                          to="/prompts/copilot"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Refine with Copilot
                        </Link>
                        <Link
                          to="/prompts/scenarios"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          Apply Scenario
                        </Link>
                        <button
                          onClick={() => setShowAdvanced(true)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          View Advanced
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Results */}
                {analysis && (
                  <div className="border-t border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Analysis</h3>

                    {/* Quality Score */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-700 mb-1">Overall Quality Score</div>
                          <div className={`text-3xl font-bold ${getQualityColor(analysis.overall_quality_score)}`}>
                            {analysis.overall_quality_score}/100
                          </div>
                        </div>
                        <div className="w-20 h-20">
                          <svg className="transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeDasharray={`${analysis.overall_quality_score}, 100`}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {analysis.strengths?.map((strength, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {analysis.gaps?.map((gap, i) => (
                            <li key={i} className="text-sm text-yellow-700 flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Improvements</h4>
                        <div className="space-y-3">
                          {analysis.suggestions.map((suggestion, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded mr-2 ${
                                      suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {suggestion.priority}
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm">{suggestion.title}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                                  <p className="text-xs text-blue-700">
                                    <strong>Impact:</strong> {suggestion.impact}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Wins */}
                    {analysis.quick_wins && analysis.quick_wins.length > 0 && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">Quick Wins</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          {analysis.quick_wins.map((win, i) => (
                            <li key={i} className="flex items-start">
                              <span className="mr-2">⚡</span>
                              <span>{win}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
