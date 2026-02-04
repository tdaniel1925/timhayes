import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function Features() {
  const features = [
    {
      category: 'AI & Intelligence',
      items: [
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ),
          title: 'Automatic Transcription',
          description: 'Every call is automatically transcribed using OpenAI Whisper, the industry-leading speech-to-text AI.',
          benefits: [
            '98% accuracy across multiple languages',
            'Processes 5-minute calls in under 30 seconds',
            'Fully searchable transcripts',
            'Background processing - no delays'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Sentiment Analysis',
          description: 'GPT-4 powered sentiment analysis gives you instant customer satisfaction scores on every call.',
          benefits: [
            'Positive, Negative, or Neutral classification',
            'Confidence scores from 0-100%',
            'Detailed reasoning for each analysis',
            'Trend tracking over time'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          title: 'Smart Insights',
          description: 'AI identifies patterns, common issues, and improvement opportunities automatically.',
          benefits: [
            'Topic clustering and trending issues',
            'Agent performance insights',
            'Resolution rate tracking',
            'Customer pain point detection'
          ]
        }
      ]
    },
    {
      category: 'Analytics & Reporting',
      items: [
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          title: 'Beautiful Dashboards',
          description: 'Real-time analytics dashboards with call volume, sentiment trends, and key metrics.',
          benefits: [
            'Customizable date ranges',
            'Interactive charts and graphs',
            'Export to PDF and CSV',
            'Scheduled email reports'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
          title: 'Advanced Search',
          description: 'Search across all call transcripts instantly. Find any conversation in seconds.',
          benefits: [
            'Full-text search across all transcripts',
            'Filter by date, duration, sentiment',
            'Keyword highlighting',
            'Saved search queries'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          ),
          title: 'Trend Analysis',
          description: 'Identify patterns and trends in customer conversations over time.',
          benefits: [
            'Daily, weekly, monthly views',
            'Sentiment trend lines',
            'Peak call time analysis',
            'Comparative period analysis'
          ]
        }
      ]
    },
    {
      category: 'Integration & Platform',
      items: [
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          title: 'Universal PBX Support',
          description: 'Works with any phone system that supports webhooks. Native support for all major platforms.',
          benefits: [
            'Grandstream UCM',
            'RingCentral',
            '3CX',
            'FreePBX, Asterisk, Yeastar, VitalPBX'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Real-Time Processing',
          description: 'Instant webhook ingestion with background AI processing. Zero user-facing delays.',
          benefits: [
            'Webhook response < 200ms',
            'Async AI processing',
            'Real-time dashboard updates',
            'No manual uploads needed'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          ),
          title: 'Multi-Tenant Architecture',
          description: 'Built for agencies and MSPs. Manage unlimited clients with complete data isolation.',
          benefits: [
            'Unlimited tenants',
            'Subdomain-based routing',
            'Per-tenant user management',
            'Individual billing and limits'
          ]
        }
      ]
    },
    {
      category: 'Security & Compliance',
      items: [
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          title: 'Enterprise Security',
          description: 'Bank-level encryption and security measures to protect your sensitive call data.',
          benefits: [
            'AES-256 encryption at rest',
            'TLS 1.3 in transit',
            'Bcrypt password hashing',
            'JWT authentication with refresh tokens'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          title: 'GDPR & Privacy Ready',
          description: 'Built with privacy regulations in mind. Full compliance with data protection laws.',
          benefits: [
            'Data retention policies',
            'Right to deletion (GDPR)',
            'Audit logging',
            'Data export capabilities'
          ]
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          title: 'Role-Based Access',
          description: 'Granular permissions control. Admins and users with different access levels.',
          benefits: [
            'Admin and User roles',
            'Per-user permissions',
            'Activity logging',
            'Session management'
          ]
        }
      ]
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Complete Call Intelligence
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-10">
            Everything you need to understand, analyze, and improve customer conversations
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-xl"
          >
            Start Free Trial
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features by Category */}
      {features.map((category, categoryIndex) => (
        <section
          key={categoryIndex}
          className={`py-20 ${categoryIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-12 text-center">
              {category.category}
            </h2>

            <div className="space-y-16">
              {category.items.map((feature, featureIndex) => (
                <div
                  key={featureIndex}
                  className={`flex flex-col ${
                    featureIndex % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } gap-12 items-center`}
                >
                  {/* Icon & Title */}
                  <div className="flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-lg text-gray-600 mb-6">{feature.description}</p>

                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual Placeholder */}
                  <div className="flex-1">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-12 aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                          {feature.icon}
                        </div>
                        <p className="text-gray-600 font-medium">{feature.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to see it in action?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
