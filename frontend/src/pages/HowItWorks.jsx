import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Connect Your Phone System',
      description: 'Add our webhook URL to your PBX configuration in just 2 minutes',
      details: [
        'Log into your phone system admin panel',
        'Navigate to CDR or webhook settings',
        'Paste the webhook URL we provide',
        'Enter authentication credentials',
        'Enable recording file transfers',
        'Save and test the connection'
      ],
      techDetails: 'Works with any PBX that supports HTTP webhooks (POST requests with JSON payloads)',
      visual: '🔌'
    },
    {
      number: '2',
      title: 'Calls Flow Automatically',
      description: 'When calls happen, your PBX sends call data to AudiaPro instantly',
      details: [
        'Customer calls your business number',
        'Your team answers and handles the call',
        'Call ends naturally',
        'PBX automatically sends CDR data',
        'Webhook receives data in <200ms',
        'Call saved to your dashboard immediately'
      ],
      techDetails: 'CDR data includes caller ID, called number, duration, disposition, timestamps, and recording file path',
      visual: '📞'
    },
    {
      number: '3',
      title: 'AI Analyzes in Background',
      description: 'Our AI processes every call automatically while you continue working',
      details: [
        'System spawns background AI worker',
        'Downloads call recording file',
        'Sends to OpenAI Whisper for transcription',
        'Transcription completes in 5-30 seconds',
        'Sends transcript to GPT-4 for sentiment',
        'Sentiment analysis completes in 2-5 seconds'
      ],
      techDetails: 'Zero user-facing delays. Webhook returns immediately. AI runs asynchronously.',
      visual: '🤖'
    },
    {
      number: '4',
      title: 'View Insights Instantly',
      description: 'Dashboard updates in real-time with searchable transcripts and sentiment',
      details: [
        'Call appears in dashboard immediately',
        'Transcription updates when ready',
        'Sentiment badge shows customer satisfaction',
        'Search across all transcripts',
        'Filter by sentiment, date, duration',
        'Export reports to CSV/PDF'
      ],
      techDetails: 'Real-time dashboard updates. No page refresh needed. Complete call history always available.',
      visual: '📊'
    }
  ];

  const workflow = {
    title: 'Complete Technical Workflow',
    stages: [
      {
        stage: 'Call Happens',
        events: [
          'Customer dials business number',
          'PBX routes call to agent',
          'Conversation takes place',
          'Recording is saved to PBX server'
        ]
      },
      {
        stage: 'Webhook Sent',
        events: [
          'PBX triggers HTTP POST webhook',
          'Sends JSON with call metadata',
          'Includes recording file path',
          'AudiaPro receives within 1 second'
        ]
      },
      {
        stage: 'Initial Processing',
        events: [
          'Validate webhook authentication',
          'Parse CDR data fields',
          'Save to PostgreSQL database',
          'Return 200 OK to PBX (<200ms)',
          'Spawn background AI thread'
        ]
      },
      {
        stage: 'AI Transcription',
        events: [
          'Download recording from PBX',
          'Send to OpenAI Whisper API',
          'Receive plain text transcription',
          'Save to database (5-30 seconds)',
          'Update dashboard in real-time'
        ]
      },
      {
        stage: 'Sentiment Analysis',
        events: [
          'Send transcript to GPT-4-mini',
          'Receive sentiment classification',
          'Get confidence score (0-100%)',
          'Save sentiment to database (2-5s)',
          'Update dashboard with badge'
        ]
      },
      {
        stage: 'User Access',
        events: [
          'View call in dashboard',
          'Read full transcription',
          'See sentiment analysis',
          'Search and filter calls',
          'Export reports'
        ]
      }
    ]
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F9FAFA] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="section-label text-[#2A2A2A]/60 mb-6">01 — HOW IT WORKS</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#31543A] mb-6 leading-tight">
            How AudiaPro
            <br />
            <span className="italic font-light text-[#3F8A84]">
              Works
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-[#2A2A2A]/70 font-light mb-10 leading-relaxed">
            From phone call to AI insights in four simple steps
          </p>
        </div>
      </section>

      {/* Main Steps */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label text-[#2A2A2A]/60 text-center mb-16">02 — THE PROCESS</div>
          {steps.map((step, index) => (
            <div key={index} className="mb-24 last:mb-0">
              {/* Step Number & Title */}
              <div className="flex items-start mb-8">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-[#31543A] to-[#3F8A84] rounded-2xl flex items-center justify-center text-white text-4xl font-serif mr-6 shadow-md">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-serif text-[#2A2A2A] mb-2">{step.title}</h2>
                  <p className="text-lg text-[#2A2A2A]/70 font-light">{step.description}</p>
                </div>
                <div className="text-6xl ml-6">{step.visual}</div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-8 ml-0 md:ml-26">
                <div>
                  <h3 className="section-label text-[#2A2A2A] mb-4">What happens:</h3>
                  <ul className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <svg className="w-5 h-5 text-[#3F8A84] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#2A2A2A] font-light">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#F9FAFA] to-[#6CA8C2]/10 rounded-2xl p-6 border border-gray-200">
                  <h3 className="section-label text-[#2A2A2A] mb-3">Technical Details:</h3>
                  <p className="text-[#2A2A2A]/70 text-sm font-light leading-relaxed">{step.techDetails}</p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="ml-10 mt-12 mb-12 h-16 w-0.5 bg-gradient-to-b from-[#31543A] to-[#3F8A84]"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Technical Workflow Diagram */}
      <section className="py-24 bg-[#F9FAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-label text-[#2A2A2A]/60 mb-4">03 — TECHNICAL FLOW</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#31543A] mb-4">
              {workflow.title}
            </h2>
            <p className="text-lg text-[#2A2A2A]/70 font-light">
              End-to-end flow from call to insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {workflow.stages.map((stage, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:border-[#31543A] hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#31543A] to-[#3F8A84] rounded-xl flex items-center justify-center text-white font-serif mr-3 shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-serif text-[#2A2A2A]">{stage.stage}</h3>
                </div>
                <ul className="space-y-2">
                  {stage.events.map((event, eventIndex) => (
                    <li key={eventIndex} className="text-sm text-[#2A2A2A]/70 font-light flex items-start">
                      <span className="text-[#3F8A84] mr-2">→</span>
                      <span>{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-label text-[#2A2A2A]/60 mb-4">04 — PERFORMANCE</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#31543A] mb-4">
              Lightning Fast Performance
            </h2>
            <p className="text-lg text-[#2A2A2A]/70 font-light">
              Built for speed and reliability
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { metric: '<200ms', label: 'Webhook Response', description: 'Instant acknowledgment to PBX' },
              { metric: '5-30s', label: 'Transcription', description: 'Audio to text processing' },
              { metric: '2-5s', label: 'Sentiment', description: 'AI analysis completion' },
              { metric: '99.9%', label: 'Uptime', description: 'Always available' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-gradient-to-br from-[#F9FAFA] to-[#6CA8C2]/10 rounded-2xl border border-gray-200">
                <div className="text-5xl font-serif text-[#31543A] mb-2">
                  {stat.metric}
                </div>
                <div className="font-serif text-[#2A2A2A] mb-1">{stat.label}</div>
                <div className="text-sm text-[#2A2A2A]/70 font-light">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-br from-[#31543A] to-[#3F8A84] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="section-label text-white/60 mb-6">05 — GET STARTED</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-6">
            Ready to see it in action?
          </h2>
          <p className="text-xl text-white/80 font-light mb-10 leading-relaxed">
            Set up takes less than 5 minutes. Start analyzing calls today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 text-lg font-medium bg-white text-[#31543A] rounded-full hover:bg-[#F9FAFA] transform hover:scale-105 transition-all shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-full hover:bg-white/10 transition-all"
            >
              Schedule Demo
            </Link>
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6CA8C2] rounded-full filter blur-[120px]"></div>
        </div>
      </section>
    </MarketingLayout>
  );
}
