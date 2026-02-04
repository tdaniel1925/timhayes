import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function Integrations() {
  const platforms = [
    {
      name: 'Grandstream UCM',
      logo: '📱',
      description: 'Native support for Grandstream UCM series',
      status: 'Fully Supported',
      setup: 'Admin Portal → CDR → HTTP Callback',
      features: ['CDR webhooks', 'Recording support', 'Real-time sync']
    },
    {
      name: 'RingCentral',
      logo: '📞',
      description: 'Enterprise cloud communications platform',
      status: 'Fully Supported',
      setup: 'Developer Console → Webhooks',
      features: ['Call logs API', 'Recording API', 'Notification webhooks']
    },
    {
      name: '3CX',
      logo: '☎️',
      description: 'Software-based PBX solution',
      status: 'Fully Supported',
      setup: 'Management Console → Call Reporting',
      features: ['CDR export', 'HTTP push', 'Recording integration']
    },
    {
      name: 'FreePBX',
      logo: '🔧',
      description: 'Open source Asterisk-based PBX',
      status: 'Fully Supported',
      setup: 'Advanced Settings → Custom Destinations',
      features: ['AMI events', 'CDR webhooks', 'Recording paths']
    },
    {
      name: 'Asterisk',
      logo: '⭐',
      description: 'The world\'s most popular open source PBX',
      status: 'Fully Supported',
      setup: 'extensions.conf → Custom dialplan',
      features: ['AMI/ARI', 'CEL/CDR', 'MixMonitor']
    },
    {
      name: 'Yeastar',
      logo: '🌟',
      description: 'SMB-focused PBX platform',
      status: 'Fully Supported',
      setup: 'PBX Settings → API & Webhooks',
      features: ['REST API', 'Event webhooks', 'Recording access']
    },
    {
      name: 'VitalPBX',
      logo: '💚',
      description: 'Modern unified communications platform',
      status: 'Fully Supported',
      setup: 'Admin Panel → Advanced Settings',
      features: ['CDR hooks', 'Recording URLs', 'Real-time events']
    },
    {
      name: 'Generic Webhook',
      logo: '🔗',
      description: 'Any system with HTTP webhook support',
      status: 'Universal Support',
      setup: 'Configure POST endpoint in your PBX',
      features: ['JSON payload', 'Custom fields', 'Flexible format']
    }
  ];

  const setupSteps = [
    {
      step: '1',
      title: 'Get Your Webhook URL',
      description: 'Log into AudiaPro and copy your unique webhook URL from the Integrations page',
      icon: '🔗'
    },
    {
      step: '2',
      title: 'Configure Your PBX',
      description: 'Add the webhook URL to your phone system\'s CDR or event notification settings',
      icon: '⚙️'
    },
    {
      step: '3',
      title: 'Set Authentication',
      description: 'Enter the webhook credentials (username/password) provided by AudiaPro',
      icon: '🔐'
    },
    {
      step: '4',
      title: 'Test Connection',
      description: 'Make a test call and verify it appears in your AudiaPro dashboard',
      icon: '✅'
    }
  ];

  const requirements = [
    {
      title: 'Webhook Support',
      description: 'Your PBX must support sending HTTP POST requests with call data',
      required: true
    },
    {
      title: 'CDR Data',
      description: 'System must provide call detail records (caller, called, duration, etc.)',
      required: true
    },
    {
      title: 'Recording Files',
      description: 'For AI features, PBX should provide access to call recording files',
      required: false
    },
    {
      title: 'JSON Format',
      description: 'Webhook payload in JSON format (we also support form-urlencoded)',
      required: false
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Works With Your
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Phone System
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-10">
            Native integrations for all major PBX platforms. If it can send webhooks, we support it.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-xl"
          >
            Get Started Free
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Supported Platforms
            </h2>
            <p className="text-lg text-gray-600">
              Tested and verified integrations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all"
              >
                <div className="text-5xl mb-4">{platform.logo}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {platform.status}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">SETUP PATH:</p>
                  <p className="text-xs text-gray-600 mb-3">{platform.setup}</p>

                  <p className="text-xs font-semibold text-gray-500 mb-2">FEATURES:</p>
                  <ul className="space-y-1">
                    {platform.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-xs text-gray-600 flex items-center">
                        <svg className="w-3 h-3 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Setup in 4 Easy Steps
            </h2>
            <p className="text-lg text-gray-600">
              Connect your PBX in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {setupSteps.map((item, index) => (
              <div key={index} className="relative text-center">
                {index < setupSteps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                )}
                <div className="relative inline-flex items-center justify-center w-32 h-32 bg-white rounded-2xl border-4 border-blue-500 shadow-lg mb-4">
                  <div className="text-5xl">{item.icon}</div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Integration Requirements
            </h2>
            <p className="text-lg text-gray-600">
              What your PBX needs to work with AudiaPro
            </p>
          </div>

          <div className="space-y-4">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-start p-6 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex-shrink-0">
                  {req.required ? (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      !
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <h3 className="font-bold text-gray-900">{req.title}</h3>
                    <span className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded ${req.required ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {req.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Not sure if your system is compatible?</h4>
                <p className="text-sm text-gray-600">
                  Contact our sales team for a free compatibility check. We'll review your PBX setup and confirm integration compatibility within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to connect your phone system?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial and get your webhook URL instantly
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
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
