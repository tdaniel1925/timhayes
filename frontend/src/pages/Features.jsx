import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MarketingLayout from '../components/MarketingLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Features() {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryNames = {
    'all': 'All Features',
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

  const categoryIcons = {
    'coaching': '📊',
    'compliance': '🛡️',
    'revenue': '💰',
    'insights': '💡',
    'customer_intelligence': '🧠',
    'real_time': '⚡',
    'analytics': '📈',
    'multilingual': '🌍',
    'integration': '🔌'
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get(`${API_URL}/features`);
      setFeatures(response.data.features || {});
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  const allFeatures = Object.values(features).flat();
  const displayFeatures = selectedCategory === 'all'
    ? features
    : { [selectedCategory]: features[selectedCategory] || [] };

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6">
            Enterprise AI Features
            <br />
            <span className="text-blue-200">Built for Your Business</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-blue-100 mb-10">
            24 powerful AI features you can mix and match to create the perfect call analytics solution.
            Pay only for what you need.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{allFeatures.length}</div>
              <div className="text-sm text-blue-200">AI Features</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white">9</div>
              <div className="text-sm text-blue-200">Categories</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-blue-200">Customizable</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-blue-200">Processing</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              to="/book-demo"
              className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-gray-50 border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {Object.keys(categoryNames).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category !== 'all' && categoryIcons[category]} {categoryNames[category]}
                {category !== 'all' && features[category] && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                    {features[category].length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI features...</p>
          </div>
        </section>
      )}

      {/* Features Display */}
      {!loading && Object.keys(displayFeatures).map(category => {
        const categoryFeatures = displayFeatures[category];
        if (!categoryFeatures || categoryFeatures.length === 0) return null;

        return (
          <section key={category} className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Category Header */}
              <div className="text-center mb-12">
                <div className="text-5xl mb-4">{categoryIcons[category]}</div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                  {categoryNames[category]}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {category === 'coaching' && 'Improve agent performance with AI-powered coaching and quality scoring'}
                  {category === 'compliance' && 'Ensure regulatory compliance and risk management with automated monitoring'}
                  {category === 'revenue' && 'Drive more revenue with intelligent sales insights and predictions'}
                  {category === 'insights' && 'Automatically extract actionable insights from every conversation'}
                  {category === 'customer_intelligence' && 'Understand your customers deeply with emotion and churn prediction'}
                  {category === 'real_time' && 'Empower agents with real-time AI assistance during calls'}
                  {category === 'analytics' && 'Make data-driven decisions with advanced conversation analytics'}
                  {category === 'multilingual' && 'Break language barriers with multi-language support'}
                  {category === 'integration' && 'Seamlessly integrate with your existing business systems'}
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryFeatures.map(feature => (
                  <div
                    key={feature.id}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all hover:shadow-xl p-6 relative overflow-hidden group"
                  >
                    {/* Beta Badge */}
                    {feature.is_beta && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          BETA
                        </span>
                      </div>
                    )}

                    {/* Feature Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-blue-600">
                          ${feature.monthly_price}
                        </span>
                        <span className="text-gray-600 ml-2">/month</span>
                      </div>
                      {feature.setup_fee > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          + ${feature.setup_fee} setup fee
                        </p>
                      )}
                    </div>

                    {/* Benefit Summary */}
                    {feature.benefit_summary && (
                      <div className="mb-4 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">
                          💡 {feature.benefit_summary}
                        </p>
                      </div>
                    )}

                    {/* Use Cases */}
                    {feature.use_cases && feature.use_cases.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                          Use Cases
                        </h4>
                        <ul className="space-y-1">
                          {feature.use_cases.slice(0, 3).map((useCase, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {useCase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ROI Metrics */}
                    {feature.roi_metrics && Object.keys(feature.roi_metrics).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                          ROI Metrics
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(feature.roi_metrics).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-semibold text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Empty State */}
      {!loading && allFeatures.length === 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600">No features available at this time.</p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to Build Your Custom Solution?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Schedule a demo to discuss which features are right for your business.
            Our team will help you create a customized package that fits your needs and budget.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/book-demo"
              className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>

          <p className="mt-8 text-blue-200 text-sm">
            💳 No credit card required • 🎯 Custom pricing • 🤝 White-glove onboarding
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">AI Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">&lt;30s</div>
              <div className="text-gray-600">Processing Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Languages</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
