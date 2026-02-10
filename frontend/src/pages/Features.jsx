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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#31543A] via-[#3F8A84] to-[#2A2A2A] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="section-label text-white/60 mb-6">01 — FEATURES</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
            Enterprise AI Features
            <br />
            <span className="italic font-light text-[#6CA8C2]">Built for Your Business</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-white/80 font-light mb-12 leading-relaxed">
            24 powerful AI features you can mix and match to create the perfect call analytics solution.
            Pay only for what you need.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-serif text-white mb-1">{allFeatures.length}</div>
              <div className="text-sm text-white/70 font-light">AI Features</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-serif text-white mb-1">9</div>
              <div className="text-sm text-white/70 font-light">Categories</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-serif text-white mb-1">100%</div>
              <div className="text-sm text-white/70 font-light">Customizable</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-serif text-white mb-1">24/7</div>
              <div className="text-sm text-white/70 font-light">Processing</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/book-demo"
              className="px-8 py-4 text-lg font-medium text-[#31543A] bg-white rounded-full hover:bg-[#F9FAFA] transform hover:scale-105 transition-all shadow-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-full hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#6CA8C2] rounded-full filter blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#E4B756] rounded-full filter blur-[120px]"></div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {Object.keys(categoryNames).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-light whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#31543A] to-[#3F8A84] text-white shadow-md font-medium'
                    : 'bg-[#F9FAFA] text-[#2A2A2A]/70 hover:bg-gray-100 hover:text-[#31543A] border border-gray-200'
                }`}
              >
                {category !== 'all' && categoryIcons[category]} {categoryNames[category]}
                {category !== 'all' && features[category] && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#31543A] mx-auto mb-4"></div>
            <p className="text-[#2A2A2A]/60 font-light">Loading AI features...</p>
          </div>
        </section>
      )}

      {/* Features Display */}
      {!loading && Object.keys(displayFeatures).map(category => {
        const categoryFeatures = displayFeatures[category];
        if (!categoryFeatures || categoryFeatures.length === 0) return null;

        return (
          <section key={category} className="py-20 bg-[#F9FAFA] border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Category Header */}
              <div className="text-center mb-16">
                <div className="text-5xl mb-4">{categoryIcons[category]}</div>
                <h2 className="text-3xl md:text-4xl font-serif text-[#31543A] mb-4">
                  {categoryNames[category]}
                </h2>
                <p className="text-lg text-[#2A2A2A]/70 font-light max-w-2xl mx-auto leading-relaxed">
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
                    className="bg-white rounded-2xl border border-gray-200 hover:border-[#31543A] transition-all hover:shadow-lg p-6 relative overflow-hidden group"
                  >
                    {/* Beta Badge */}
                    {feature.is_beta && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-[#E4B756]/10 text-[#E4B756] border border-[#E4B756]/30 rounded-full text-xs font-medium">
                          BETA
                        </span>
                      </div>
                    )}

                    {/* Feature Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-serif text-[#2A2A2A] mb-2 group-hover:text-[#31543A] transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-[#2A2A2A]/70 font-light leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-serif text-[#31543A]">
                          ${feature.monthly_price}
                        </span>
                        <span className="text-[#2A2A2A]/60 text-sm ml-2 font-light">/month</span>
                      </div>
                      {feature.setup_fee > 0 && (
                        <p className="text-sm text-[#2A2A2A]/50 font-light mt-1">
                          + ${feature.setup_fee} setup fee
                        </p>
                      )}
                    </div>

                    {/* Benefit Summary */}
                    {feature.benefit_summary && (
                      <div className="mb-4 bg-[#6CA8C2]/10 border border-[#6CA8C2]/20 rounded-xl p-3">
                        <p className="text-sm font-light text-[#2A2A2A]">
                          💡 {feature.benefit_summary}
                        </p>
                      </div>
                    )}

                    {/* Use Cases */}
                    {feature.use_cases && feature.use_cases.length > 0 && (
                      <div className="mb-4">
                        <h4 className="section-label text-[#2A2A2A] mb-3">
                          Use Cases
                        </h4>
                        <ul className="space-y-2">
                          {feature.use_cases.slice(0, 3).map((useCase, idx) => (
                            <li key={idx} className="text-sm text-[#2A2A2A]/70 font-light flex items-start">
                              <svg className="w-4 h-4 text-[#3F8A84] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="section-label text-[#2A2A2A] mb-3">
                          ROI Metrics
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(feature.roi_metrics).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-xs">
                              <span className="text-[#2A2A2A]/60 font-light capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-medium text-[#2A2A2A]">{value}</span>
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
            <p className="text-[#2A2A2A]/60 font-light">No features available at this time.</p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#31543A] to-[#3F8A84] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="section-label text-white/60 mb-6">02 — GET STARTED</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-6">
            Ready to Build Your Custom Solution?
          </h2>
          <p className="text-xl text-white/80 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Schedule a demo to discuss which features are right for your business.
            Our team will help you create a customized package that fits your needs and budget.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/book-demo"
              className="px-8 py-4 text-lg font-medium text-[#31543A] bg-white rounded-full hover:bg-[#F9FAFA] transform hover:scale-105 transition-all shadow-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-full hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>

          <p className="mt-8 text-white/70 text-sm font-light">
            💳 No credit card required • 🎯 Custom pricing • 🤝 White-glove onboarding
          </p>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6CA8C2] rounded-full filter blur-[120px]"></div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label text-[#2A2A2A]/60 text-center mb-12">03 — TRUST</div>
          <div className="grid md:grid-cols-4 gap-10 text-center">
            <div>
              <div className="text-5xl font-serif text-[#31543A] mb-2">98%</div>
              <div className="text-[#2A2A2A]/60 font-light">AI Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-serif text-[#31543A] mb-2">&lt;30s</div>
              <div className="text-[#2A2A2A]/60 font-light">Processing Time</div>
            </div>
            <div>
              <div className="text-5xl font-serif text-[#31543A] mb-2">50+</div>
              <div className="text-[#2A2A2A]/60 font-light">Languages</div>
            </div>
            <div>
              <div className="text-5xl font-serif text-[#31543A] mb-2">99.9%</div>
              <div className="text-[#2A2A2A]/60 font-light">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
