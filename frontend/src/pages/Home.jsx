import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function Home() {
  const metrics = [
    { icon: '📞', label: 'Call Quality Score', category: 'Performance' },
    { icon: '😊', label: 'Customer Sentiment', category: 'Experience' },
    { icon: '⚠️', label: 'Churn Risk Indicators', category: 'Retention' },
    { icon: '💰', label: 'Deal Risk Scoring', category: 'Revenue' },
    { icon: '🎯', label: 'Buyer Intent Signals', category: 'Sales' },
    { icon: '📊', label: 'Objection Analysis', category: 'Coaching' },
    { icon: '🗣️', label: 'Talk/Listen Ratio', category: 'Engagement' },
    { icon: '⏱️', label: 'Response Time', category: 'Efficiency' },
  ];

  const industries = [
    { name: 'B2B Sales', icon: '💼', metrics: '120+ metrics' },
    { name: 'B2C Sales', icon: '🛍️', metrics: '95+ metrics' },
    { name: 'Customer Support', icon: '🎧', metrics: '110+ metrics' },
    { name: 'Healthcare', icon: '🏥', metrics: '85+ metrics' },
    { name: 'Financial Services', icon: '💰', metrics: '105+ metrics' },
    { name: 'Real Estate', icon: '🏠', metrics: '90+ metrics' },
  ];

  const stats = [
    { value: '100+', label: 'Data Points Tracked' },
    { value: '24', label: 'AI Features Available' },
    { value: '<5min', label: 'Setup Time' },
    { value: '99.9%', label: 'Uptime SLA' }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-32 sm:pb-40">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              Powered by OpenAI GPT-4 & Advanced Machine Learning
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Your Most Valuable Data
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                Is On Your Phones!
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-blue-100 mb-12 leading-relaxed">
              Stop letting critical business intelligence disappear after every call.
              AudiaPro captures, analyzes, and delivers <span className="text-yellow-300 font-bold">100+ actionable insights</span> from
              <span className="text-white font-semibold"> every phone conversation</span> — customized to your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/book-demo"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Book a Demo
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transform transition-all duration-200 flex items-center gap-2"
              >
                See How It Works
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                5-Minute Setup
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 fill-current text-gray-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Every Call Is a Gold Mine of <span className="text-blue-600">Business Intelligence</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your team has hundreds — maybe thousands — of customer conversations every month.
              Each one contains patterns, insights, and opportunities that could transform your business.
              <span className="block mt-4 text-2xl font-semibold text-gray-900">
                But without AudiaPro, that data vanishes the moment you hang up.
              </span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Preview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">100+ Metrics</span> Automatically Tracked
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every call is analyzed across dozens of dimensions. Here's just a sample of what AudiaPro measures:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="text-4xl mb-3">{metric.icon}</div>
                <div className="text-sm font-semibold text-blue-600 mb-2">{metric.category}</div>
                <div className="font-bold text-gray-900">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 text-lg mb-6">Plus 90+ more metrics including...</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Emotion Detection', 'Keyword Tracking', 'Topic Analysis', 'Compliance Monitoring', 'Action Items', 'Next Best Actions', 'Competition Mentions', 'Pricing Discussions', 'Objection Patterns', 'Success Indicators'].map((item, i) => (
                <span key={i} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Customization */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Customized to <span className="text-indigo-600">Your Industry</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Not all businesses are the same. AudiaPro adapts its analysis to what matters most in your industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                <div className="text-5xl mb-4">{industry.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{industry.name}</h3>
                <p className="text-indigo-600 font-semibold text-lg">{industry.metrics}</p>
                <p className="text-gray-600 mt-3">
                  Tailored insights for your specific business needs
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/features" className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-lg hover:text-indigo-700">
              See all industry customizations
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Quick */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Setup in <span className="text-blue-600">Under 5 Minutes</span>
            </h2>
            <p className="text-xl text-gray-600">
              No complex installation. No IT team required. Just instant intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Phone System</h3>
              <p className="text-gray-600">
                Works with Grandstream, RingCentral, 3CX, FreePBX, and any system with webhooks
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customize Your Metrics</h3>
              <p className="text-gray-600">
                Choose your industry, select which insights matter most, and let AI do the rest
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Getting Insights</h3>
              <p className="text-gray-600">
                Every call is automatically analyzed. View dashboards, export reports, get alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Letting Valuable Data Disappear
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Every call your team makes contains insights that could improve customer satisfaction,
            boost sales, reduce churn, and grow your business. Start capturing that value today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book-demo"
              className="px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transform transition-all duration-200"
            >
              Book Your Demo
            </Link>
            <Link
              to="/pricing"
              className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold text-xl hover:bg-white/20 transform transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
