import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'annual'

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 49,
      annualPrice: 490, // ~$41/mo
      description: 'Perfect for small teams getting started',
      calls: '500 calls/month',
      features: [
        '500 AI-analyzed calls per month',
        '2 team members',
        'Call transcription',
        'Sentiment analysis',
        'Basic analytics dashboard',
        '30-day call history',
        'Email support',
        'CSV export'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      monthlyPrice: 149,
      annualPrice: 1490, // ~$124/mo
      description: 'For growing businesses with higher volume',
      calls: '2,000 calls/month',
      features: [
        '2,000 AI-analyzed calls per month',
        '10 team members',
        'Advanced transcription',
        'Sentiment analysis with reasoning',
        'Advanced analytics & trends',
        '1-year call history',
        'Priority email support',
        'CSV & PDF export',
        'Scheduled reports',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      monthlyPrice: 399,
      annualPrice: 3990, // ~$333/mo
      description: 'For large teams with custom needs',
      calls: 'Unlimited calls',
      features: [
        'Unlimited AI-analyzed calls',
        'Unlimited team members',
        'Premium transcription',
        'Advanced sentiment AI',
        'Custom analytics & dashboards',
        'Lifetime call history',
        'Dedicated support manager',
        'All export formats',
        'Automated reporting',
        'White-label option',
        'SLA guarantee',
        'Custom integrations & webhooks',
        'Advanced security features'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'You get full access to your chosen plan for 14 days, completely free. No credit card required to start. You can cancel anytime during the trial with no charges.'
    },
    {
      question: 'What counts as a "call"?',
      answer: 'A call is any inbound or outbound phone conversation received by our webhook. Missed calls without recordings are not counted towards your limit.'
    },
    {
      question: 'What happens if I exceed my call limit?',
      answer: 'New calls will still be logged, but AI features (transcription and sentiment) will be paused until the next billing cycle or you upgrade your plan. You\'ll receive email warnings at 80% and 100%.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Absolutely! You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.'
    },
    {
      question: 'Do you offer annual billing?',
      answer: 'Yes! Annual billing saves you 2 months (16.7% discount). You can switch to annual billing from your account settings.'
    },
    {
      question: 'What phone systems do you support?',
      answer: 'We support any phone system that can send webhooks, including Grandstream, RingCentral, 3CX, FreePBX, Asterisk, Yeastar, and VitalPBX. If it can send HTTP POST requests, we can integrate with it.'
    },
    {
      question: 'How accurate is the AI transcription?',
      answer: 'Our transcription uses OpenAI Whisper, which achieves ~98% accuracy on clear audio. Accuracy depends on audio quality, background noise, and accents.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are GDPR-ready and follow industry-standard security practices. Your data is never shared with third parties.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! You can export calls to CSV or PDF at any time. Enterprise plans include automated scheduled exports via email.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes. If you\'re not satisfied within the first 30 days, we\'ll provide a full refund, no questions asked.'
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            Choose the plan that fits your business. All plans include AI transcription and sentiment analysis.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md mb-12">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual <span className="text-xs">(Save 16%)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-2xl scale-105 z-10'
                    : 'border border-gray-200 shadow-lg'
                } bg-white p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-5xl font-extrabold text-gray-900">
                      ${billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                    </span>
                    <span className="text-gray-600">/mo</span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="text-sm text-green-600 font-medium">
                      ${plan.annualPrice}/year (billed annually)
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">{plan.calls}</p>
                </div>

                {/* CTA Button */}
                <Link
                  to={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center mb-8 transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features List */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-4">What's included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Trusted by hundreds of businesses worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">SOC 2 Ready</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">30-Day Money Back</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about pricing and plans
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                  {faq.question}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-blue-600 hover:text-blue-700"
            >
              Contact our sales team
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold bg-white text-blue-600 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
          >
            Start Free Trial
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
