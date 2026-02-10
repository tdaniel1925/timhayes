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
      {/* Hero Section - SUSTAIN Style */}
      <section className="relative overflow-hidden bg-[#31543A] border-b border-[#3F8A84]/20">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6CA8C2] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#E4B756] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40 sm:pt-40 sm:pb-48">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium mb-8 uppercase tracking-wide">
              <span className="w-2 h-2 bg-[#E4B756] rounded-full mr-3 animate-pulse"></span>
              Powered by OpenAI GPT-4 & Advanced Machine Learning
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-white mb-8 leading-[1.05]">
              Your Most Valuable Data
              <br />
              <span className="italic font-light text-[#6CA8C2]">
                Is On Your Phones
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-white/80 mb-12 leading-relaxed font-light">
              Stop letting critical business intelligence disappear after every call.
              AudiaPro captures, analyzes, and delivers <span className="text-[#E4B756] font-semibold">100+ actionable insights</span> from
              <span className="text-white font-medium"> every phone conversation</span> — customized to your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/book-demo"
                className="px-8 py-4 bg-white text-[#31543A] rounded-full font-medium text-base shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Book a Demo
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-full font-medium text-base hover:bg-white/20 transform transition-all duration-200 inline-flex items-center gap-2"
              >
                See How It Works
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-white/70 text-sm font-light">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E4B756]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E4B756]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                5-Minute Setup
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E4B756]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24 bg-[#F9FAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="section-label text-[#E4B756] mb-4">
              01 — The Challenge
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#31543A] mb-8 mt-4 leading-tight">
              Every Call Is a Gold Mine of <span className="italic text-[#3F8A84]">Business Intelligence</span>
            </h2>
            <p className="text-lg text-[#2A2A2A]/70 leading-relaxed font-light">
              Your team has hundreds — maybe thousands — of customer conversations every month.
              Each one contains patterns, insights, and opportunities that could transform your business.
            </p>
            <p className="text-xl font-serif text-[#31543A] mt-6">
              But without AudiaPro, that data vanishes the moment you hang up.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="text-4xl md:text-5xl font-serif text-[#3F8A84] mb-2">{stat.value}</div>
                <div className="text-[#2A2A2A]/60 font-light text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Preview */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label text-[#6CA8C2] mb-4">
              02 — Intelligence
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#31543A] mb-6 mt-4">
              <span className="text-[#3F8A84]">100+ Metrics</span> Automatically Tracked
            </h2>
            <p className="text-lg text-[#2A2A2A]/70 max-w-3xl mx-auto font-light">
              Every call is analyzed across dozens of dimensions. Here's just a sample of what AudiaPro measures:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-[#F9FAFA] rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300 group">
                <div className="text-4xl mb-3">{metric.icon}</div>
                <div className="text-xs font-semibold text-[#3F8A84] mb-2 uppercase tracking-wide">{metric.category}</div>
                <div className="font-medium text-[#31543A] group-hover:text-[#3F8A84] transition-colors">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 font-light text-base mb-6">Plus 90+ more metrics including...</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Emotion Detection', 'Keyword Tracking', 'Topic Analysis', 'Compliance Monitoring', 'Action Items', 'Next Best Actions', 'Competition Mentions', 'Pricing Discussions', 'Objection Patterns', 'Success Indicators'].map((item, i) => (
                <span key={i} className="px-4 py-2 bg-[#31543A]/5 text-[#31543A] border border-[#31543A]/10 rounded-full text-sm font-light">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Customization */}
      <section className="py-24 bg-[#31543A] text-white relative overflow-hidden">
        {/* Abstract Decoration */}
        <div className="absolute left-0 bottom-0 w-1/2 h-full bg-[#3F8A84] opacity-10 blur-3xl transform -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="section-label text-[#E4B756] mb-4">
              03 — Customization
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif mb-6 mt-4">
              Customized to <span className="italic text-[#6CA8C2]">Your Industry</span>
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto font-light">
              Not all businesses are the same. AudiaPro adapts its analysis to what matters most in your industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="border-l border-white/20 pl-6 hover:border-[#E4B756] transition-colors">
                <div className="text-5xl mb-4">{industry.icon}</div>
                <h3 className="text-xl font-serif text-white mb-2">{industry.name}</h3>
                <p className="text-[#E4B756] font-semibold text-base mb-3">{industry.metrics}</p>
                <p className="text-white/60 font-light text-sm leading-relaxed">
                  Tailored insights for your specific business needs
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/features" className="inline-flex items-center gap-2 text-[#E4B756] font-medium hover:opacity-70 transition-opacity border-b border-[#E4B756] pb-1">
              See all industry customizations
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span className="section-label text-[#C89A8F] mb-4">
              04 — Setup
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#31543A] mb-6 mt-4">
              Setup in <span className="italic text-[#3F8A84]">Under 5 Minutes</span>
            </h2>
            <p className="text-lg text-[#2A2A2A]/70 font-light">
              No complex installation. No IT team required. Just instant intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-[#31543A]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#31543A] transition-colors">
                <span className="text-3xl font-serif text-[#31543A] group-hover:text-white transition-colors">1</span>
              </div>
              <h3 className="text-xl font-serif text-[#31543A] mb-4">Connect Your Phone System</h3>
              <p className="text-[#2A2A2A]/60 font-light leading-relaxed">
                Works with Grandstream, RingCentral, 3CX, FreePBX, and any system with webhooks
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-[#3F8A84]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#3F8A84] transition-colors">
                <span className="text-3xl font-serif text-[#3F8A84] group-hover:text-white transition-colors">2</span>
              </div>
              <h3 className="text-xl font-serif text-[#31543A] mb-4">Customize Your Metrics</h3>
              <p className="text-[#2A2A2A]/60 font-light leading-relaxed">
                Choose your industry, select which insights matter most, and let AI do the rest
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-[#E4B756]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#E4B756] transition-colors">
                <span className="text-3xl font-serif text-[#E4B756] group-hover:text-white transition-colors">3</span>
              </div>
              <h3 className="text-xl font-serif text-[#31543A] mb-4">Start Getting Insights</h3>
              <p className="text-[#2A2A2A]/60 font-light leading-relaxed">
                Every call is automatically analyzed. View dashboards, export reports, get alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#31543A] to-[#3F8A84]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-serif text-white mb-6 leading-tight">
            Stop Letting Valuable Data Disappear
          </h2>
          <p className="text-lg text-white/80 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            Every call your team makes contains insights that could improve customer satisfaction,
            boost sales, reduce churn, and grow your business. Start capturing that value today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book-demo"
              className="px-10 py-5 bg-white text-[#31543A] rounded-full font-medium text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200"
            >
              Book Your Demo
            </Link>
            <Link
              to="/pricing"
              className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-full font-medium text-lg hover:bg-white/20 transform transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-white/70 text-sm mt-6 font-light">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
