import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function Pricing() {
  const baseServiceFeatures = [
    'Call Detail Record (CDR) Collection',
    'Real-time Webhook Integration',
    'Call Duration & Status Tracking',
    'Caller ID & Number Information',
    'Multi-tenant Account Management',
    'User Role Management',
    'Basic Call History & Search',
    'Secure Data Storage',
    'REST API Access',
    'Email Notifications',
    '99.9% Uptime SLA',
    '24/7 Platform Availability'
  ];

  const addonCategories = [
    {
      name: 'Call Quality & Coaching',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Improve agent performance with AI coaching',
      examples: ['Call Quality Scoring', 'Agent Performance Analytics', 'Coaching Insights']
    },
    {
      name: 'Compliance & Risk',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Ensure regulatory compliance automatically',
      examples: ['Compliance Monitoring', 'PCI Detection', 'Risk Flagging']
    },
    {
      name: 'Revenue Intelligence',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Drive more revenue with intelligent insights',
      examples: ['Upsell Detection', 'Deal Risk Analysis', 'Win/Loss Prediction']
    },
    {
      name: 'Automated Insights',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      description: 'Extract actionable insights automatically',
      examples: ['AI Summaries', 'Action Items', 'Next Steps', 'Key Topics']
    },
    {
      name: 'Customer Intelligence',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Understand customers deeply with emotion AI',
      examples: ['Sentiment Analysis', 'Emotion Detection', 'Churn Prediction']
    },
    {
      name: 'Real-Time AI',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      description: 'Empower agents with real-time assistance',
      examples: ['Live Transcription', 'Real-time Sentiment', 'Live Coaching']
    },
    {
      name: 'Advanced Analytics',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Make data-driven decisions',
      examples: ['Conversation Analytics', 'Trend Analysis', 'Custom Reports']
    },
    {
      name: 'Multilingual & Global',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      description: 'Break language barriers',
      examples: ['Multi-language Support', 'Auto Translation', 'Language Detection']
    },
    {
      name: 'Integration Intelligence',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      description: 'Seamlessly integrate with your systems',
      examples: ['CRM Sync', 'Slack Alerts', 'Custom Webhooks']
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6">
            Transparent Pricing
            <br />
            <span className="text-blue-200">Pay Only For What You Use</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-blue-100 mb-10">
            Start with our powerful base platform, then add AI features as your business grows.
            No hidden fees, no surprises.
          </p>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>
      </section>

      {/* Base Service */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Base Service Included
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to collect, store, and analyze your call data starts here
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Platform Base</h3>
                <p className="text-gray-600">Everything you need to get started</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">Contact Us</div>
                <p className="text-sm text-gray-600">Custom pricing based on volume</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {baseServiceFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-blue-200 flex justify-center gap-4">
              <Link
                to="/book-demo"
                className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Schedule Demo
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons Overview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              AI-Powered Add-Ons
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enhance your platform with 24 AI features across 9 categories. Mix and match to create your perfect solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {addonCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all hover:shadow-xl p-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                <div className="space-y-1">
                  {category.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/features"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-xl"
            >
              View All Features & Pricing
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              How Pricing Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start With Base</h3>
              <p className="text-gray-600">
                Get the complete platform with CDR collection, webhooks, and basic analytics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Add AI Features</h3>
              <p className="text-gray-600">
                Choose from 24 AI features. Each feature has transparent monthly pricing
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Scale As You Grow</h3>
              <p className="text-gray-600">
                Add or remove features anytime. Only pay for what you use
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Pricing FAQs
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What's included in the base service?
              </h3>
              <p className="text-gray-600">
                The base service includes all core platform features: CDR collection, webhook integration, call tracking,
                user management, basic analytics, API access, and secure data storage with 99.9% uptime SLA.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How are AI add-ons priced?
              </h3>
              <p className="text-gray-600">
                Each AI feature has transparent monthly pricing displayed on our Features page. You can enable or disable
                features anytime through your account dashboard. Some features may have a one-time setup fee.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I customize my package?
              </h3>
              <p className="text-gray-600">
                Absolutely! That's the beauty of our modular approach. Choose only the features you need. Our sales team
                can also create custom packages for enterprise customers with specific requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! We offer a free demo where you can test the platform with sample data. Contact our sales team to
                schedule a personalized demo and discuss your specific needs.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What if I need to change my features later?
              </h3>
              <p className="text-gray-600">
                You can add or remove AI features at any time through your admin dashboard or by contacting support.
                Changes take effect immediately, and billing is adjusted for the next cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a demo to discuss your needs and get custom pricing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book-demo"
              className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
            >
              Schedule Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
