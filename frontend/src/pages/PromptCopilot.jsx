import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PromptCopilot() {
  const { getAuthHeader } = useAuth();
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

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
    }
  };

  const handleFeatureSelect = async (feature) => {
    setSelectedFeature(feature);
    setConversationHistory([]);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get current prompt for this feature
      const response = await axios.get(`${API_URL}/prompts/defaults`, {
        headers: getAuthHeader(),
        params: { feature: feature.slug }
      });

      setCurrentPrompt(response.data.prompt || '');

      // Add system message
      setConversationHistory([{
        role: 'system',
        content: `Now optimizing: ${feature.name}. Tell me what you'd like to improve about this AI feature's analysis.`,
        timestamp: new Date()
      }]);
    } catch (err) {
      setError('Failed to load feature prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !selectedFeature) return;

    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setConversationHistory([...conversationHistory, newUserMessage]);
    setUserMessage('');
    setRefining(true);
    setError('');

    try {
      // Call copilot refinement API
      const response = await axios.post(
        `${API_URL}/prompts/copilot/refine`,
        {
          feature_slug: selectedFeature.slug,
          user_request: userMessage,
          current_prompt: currentPrompt,
          conversation_history: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        { headers: getAuthHeader() }
      );

      const copilotResponse = {
        role: 'assistant',
        content: response.data.changes_summary,
        explanation: response.data.explanation,
        refined_prompt: response.data.refined_prompt,
        confidence: response.data.confidence,
        suggestions: response.data.suggestions || [],
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, copilotResponse]);
      setCurrentPrompt(response.data.refined_prompt);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to refine prompt');
      console.error('Refinement failed:', err);
    } finally {
      setRefining(false);
    }
  };

  const handleApplyRefinement = async () => {
    if (!selectedFeature || !currentPrompt) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const lastAssistantMessage = [...conversationHistory].reverse().find(msg => msg.role === 'assistant');

      await axios.post(
        `${API_URL}/prompts/copilot/apply`,
        {
          feature_slug: selectedFeature.slug,
          refined_prompt: currentPrompt,
          changes_summary: lastAssistantMessage?.content || 'Copilot refinement applied'
        },
        { headers: getAuthHeader() }
      );

      setSuccess('Prompt successfully applied! Your AI feature will now use this refined prompt.');

      // Add success message to conversation
      setConversationHistory(prev => [...prev, {
        role: 'system',
        content: '✅ Prompt applied successfully! This will be used for all future analyses.',
        timestamp: new Date()
      }]);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply refinement');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    if (!selectedFeature) return;
    handleFeatureSelect(selectedFeature);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Prompt Copilot</h1>
              <p className="text-gray-600 mt-1">Describe what you want, and I'll refine your AI prompts for you</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <strong>No prompt editing required!</strong> Just tell me what outcomes you want (e.g., "Make sentiment more sensitive to frustration" or "Focus more on price objections") and I'll handle the technical details.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Feature Selector */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select AI Feature</h2>

              {loading && !selectedFeature ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {features.map((feature) => (
                    <button
                      key={feature.slug}
                      onClick={() => handleFeatureSelect(feature)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedFeature?.slug === feature.slug
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{feature.name}</div>
                      <div className={`text-xs mt-1 ${
                        selectedFeature?.slug === feature.slug ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {feature.industry_count} variations
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="col-span-9">
            {!selectedFeature ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an AI Feature to Get Started</h3>
                <p className="text-gray-600">Choose a feature from the left to begin refining its prompts</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[700px]">
                {/* Chat Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedFeature.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">Chat with your AI copilot to refine this feature</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleResetToDefault}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Reset to Default
                      </button>
                      {conversationHistory.some(msg => msg.role === 'assistant' && msg.refined_prompt) && (
                        <button
                          onClick={handleApplyRefinement}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                        >
                          Apply Changes
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  )}

                  {conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3xl ${
                        message.role === 'system' ? 'w-full' :
                        message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-4`}>
                        {message.role === 'system' ? (
                          <div className="text-center text-sm text-gray-600 italic">
                            {message.content}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center mb-2">
                              {message.role === 'assistant' && (
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                  </svg>
                                </div>
                              )}
                              <span className="text-xs font-semibold">
                                {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Copilot' : 'System'}
                              </span>
                            </div>

                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                            {message.explanation && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 mb-1">Details:</div>
                                <div className="text-xs text-gray-600">{message.explanation}</div>
                              </div>
                            )}

                            {message.confidence && (
                              <div className="mt-2 flex items-center">
                                <div className="text-xs text-gray-600 mr-2">Confidence:</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                  <div
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                                    style={{ width: `${message.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 ml-2">
                                  {Math.round(message.confidence * 100)}%
                                </span>
                              </div>
                            )}

                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 mb-2">Suggestions:</div>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {message.suggestions.map((suggestion, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {refining && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">Refining your prompt...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-6">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Describe what you want to improve (e.g., 'Make sentiment more sensitive to frustration')"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={refining}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim() || refining}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Examples: "Focus more on price objections" • "Be stricter about professionalism" • "Detect frustration earlier"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
