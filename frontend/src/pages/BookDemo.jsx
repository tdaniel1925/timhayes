import React, { useEffect } from 'react';
import MarketingLayout from '../components/MarketingLayout';

export default function BookDemo() {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.Cal) {
        window.Cal("init", "30min", { origin: "https://app.cal.com" });

        window.Cal.ns["30min"]("inline", {
          elementOrSelector: "#my-cal-inline-30min",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
          calLink: "botmakers/30min",
        });

        window.Cal.ns["30min"]("ui", { hideEventTypeDetails: false, layout: "month_view" });
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Book a Demo
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Enterprise Call Analytics
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-10">
            Discover how AudiaPro's AI-powered call analytics can transform your customer insights.
            Schedule a personalized demo with our team to see the platform in action.
          </p>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">30-Minute Demo</h3>
              <p className="text-sm text-gray-600">Quick walkthrough of all features tailored to your needs</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Custom Solutions</h3>
              <p className="text-sm text-gray-600">Tailored to your industry, call volume, and requirements</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Setup</h3>
              <p className="text-sm text-gray-600">Start analyzing calls within 24 hours of onboarding</p>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Cal.com Embed */}
            <div style={{ width: '100%', height: '700px', overflow: 'scroll' }} id="my-cal-inline-30min"></div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              What to Expect in Your Demo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We'll show you exactly how AudiaPro can revolutionize your call analytics
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Platform Walkthrough',
                description: 'See the full dashboard, analytics, and reporting capabilities in action',
                icon: '🎯'
              },
              {
                title: 'AI Capabilities',
                description: 'Watch real-time transcription and sentiment analysis on actual calls',
                icon: '🤖'
              },
              {
                title: 'Integration Setup',
                description: 'Learn how to connect your PBX system in minutes',
                icon: '🔌'
              },
              {
                title: 'Custom Pricing',
                description: 'Get a quote tailored to your call volume and team size',
                icon: '💰'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Is there a free trial?',
                answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.'
              },
              {
                question: 'How long does setup take?',
                answer: 'Most customers are up and running within 24 hours. Our team handles the technical setup and provides full onboarding support.'
              },
              {
                question: 'What phone systems do you support?',
                answer: 'We integrate with Grandstream, RingCentral, 3CX, FreePBX, Asterisk, Yeastar, VitalPBX, and any system that supports webhooks.'
              },
              {
                question: 'How is pricing structured?',
                answer: 'Enterprise pricing is based on your monthly call volume, number of users, and feature requirements. We\'ll provide a custom quote during your demo.'
              },
              {
                question: 'Can I cancel anytime?',
                answer: 'Yes, we offer flexible month-to-month contracts with no long-term commitments required.'
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 p-6 group"
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
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Transcription Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">&lt;30s</div>
              <div className="text-blue-100">Processing Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
