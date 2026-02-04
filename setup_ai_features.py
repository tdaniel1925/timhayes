#!/usr/bin/env python3
"""
Complete AI Features Setup Script
This script:
1. Creates super admin account (if needed)
2. Seeds all 24 AI features into database
3. Enables features for test tenant

Usage:
    python setup_ai_features.py
"""

import os
import sys
import json
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash
from datetime import datetime

# Get database URL from environment or use Railway default
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('RAILWAY_DATABASE_URL')

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not set")
    print("\nTo get your DATABASE_URL:")
    print("1. Go to https://railway.app")
    print("2. Select your project")
    print("3. Go to Variables tab")
    print("4. Copy the DATABASE_URL value")
    print("\nThen run:")
    print('   export DATABASE_URL="postgresql://..."')
    print("   python setup_ai_features.py")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

# All 24 AI Features Data
FEATURES_DATA = [
    # COACHING CATEGORY
    {
        'name': 'AI Call Summaries',
        'slug': 'call-summaries',
        'description': 'Automatic 2-3 sentence summary of every call using GPT-4',
        'long_description': 'Never manually write call notes again. Our AI generates concise, accurate summaries of every conversation instantly after the call ends.',
        'category': 'coaching',
        'icon': 'DocumentTextIcon',
        'monthly_price': 99.00,
        'setup_fee': 0,
        'price_per_call': 0.05,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 15,
        'benefit_summary': 'Save 80% of time spent on call documentation',
        'use_cases': json.dumps([
            'Customer support call logs',
            'Sales conversation notes',
            'Manager review preparation'
        ]),
        'roi_metrics': json.dumps({
            'time_saved_per_call': '3-5 minutes',
            'accuracy_improvement': '95%',
            'cost_per_call': '$0.05'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 1
    },
    {
        'name': 'Call Quality Scoring',
        'slug': 'quality-scoring',
        'description': 'AI-powered scoring across 6 quality dimensions with actionable feedback',
        'long_description': 'Automatically evaluate every call across greeting, professionalism, closing, objection handling, empathy, and product knowledge.',
        'category': 'coaching',
        'icon': 'StarIcon',
        'monthly_price': 149.00,
        'setup_fee': 0,
        'price_per_call': 0.08,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 20,
        'benefit_summary': 'Improve agent performance by 40% in 90 days',
        'use_cases': json.dumps([
            'Agent performance reviews',
            'Training needs identification',
            'Quality assurance automation'
        ]),
        'roi_metrics': json.dumps({
            'performance_improvement': '40%',
            'qa_time_saved': '10 hours/week',
            'consistency_increase': '85%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 2
    },
    {
        'name': 'Action Items Extraction',
        'slug': 'action-items',
        'description': 'Automatically extract tasks, follow-ups, and commitments from calls',
        'long_description': 'Never miss a follow-up again. AI identifies and extracts all action items, deadlines, and commitments made during conversations.',
        'category': 'insights',
        'icon': 'CheckCircleIcon',
        'monthly_price': 79.00,
        'setup_fee': 0,
        'price_per_call': 0.04,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 10,
        'benefit_summary': 'Eliminate dropped follow-ups and missed commitments',
        'use_cases': json.dumps([
            'Sales follow-up tracking',
            'Support ticket creation',
            'Project management'
        ]),
        'roi_metrics': json.dumps({
            'followup_completion': '95%',
            'deals_saved': '12%',
            'customer_satisfaction': '+25 NPS'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 3
    },
    {
        'name': 'Topic Extraction',
        'slug': 'topic-extraction',
        'description': 'Identify main discussion topics and keywords from conversations',
        'long_description': 'Understand what customers are really talking about. AI categorizes and tags conversations by topic for better analytics.',
        'category': 'insights',
        'icon': 'TagIcon',
        'monthly_price': 69.00,
        'setup_fee': 0,
        'price_per_call': 0.03,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 12,
        'benefit_summary': 'Discover trends and patterns across thousands of calls',
        'use_cases': json.dumps([
            'Product feedback analysis',
            'Feature request tracking',
            'Pain point identification'
        ]),
        'roi_metrics': json.dumps({
            'trend_discovery_speed': '10x faster',
            'pattern_accuracy': '92%',
            'product_feedback_captured': '100%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 4
    },

    # COMPLIANCE CATEGORY
    {
        'name': 'Compliance Monitoring',
        'slug': 'compliance-monitoring',
        'description': 'Real-time detection of regulatory keywords and compliance violations',
        'long_description': 'Protect your business with automatic monitoring for prohibited language, required disclosures, and regulatory compliance.',
        'category': 'compliance',
        'icon': 'ShieldCheckIcon',
        'monthly_price': 299.00,
        'setup_fee': 199.00,
        'price_per_call': 0.10,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 18,
        'benefit_summary': 'Prevent costly fines with 99.8% violation detection',
        'use_cases': json.dumps([
            'TCPA compliance (Do Not Call)',
            'HIPAA compliance (healthcare)',
            'Financial services regulations'
        ]),
        'roi_metrics': json.dumps({
            'violation_detection': '99.8%',
            'fine_prevention': '$500K+/year',
            'audit_time_saved': '40 hours/month'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': True,
        'display_order': 5
    },

    # CUSTOMER INTELLIGENCE
    {
        'name': 'Sentiment Analysis',
        'slug': 'sentiment-analysis',
        'description': 'Track customer emotion and satisfaction throughout calls',
        'long_description': 'Understand how customers feel. AI analyzes tone and language to detect positive, negative, or neutral sentiment.',
        'category': 'customer_intelligence',
        'icon': 'EmojiHappyIcon',
        'monthly_price': 89.00,
        'setup_fee': 0,
        'price_per_call': 0.03,
        'requires_openai': True,
        'openai_model': 'gpt-4o-mini',
        'processing_time_estimate': 8,
        'benefit_summary': 'Catch at-risk customers before they churn',
        'use_cases': json.dumps([
            'Customer satisfaction tracking',
            'Escalation prevention',
            'Agent performance monitoring'
        ]),
        'roi_metrics': json.dumps({
            'churn_reduction': '18%',
            'early_warning_accuracy': '87%',
            'retention_improvement': '$120K/year'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 6
    },
    {
        'name': 'Emotion Detection',
        'slug': 'emotion-detection',
        'description': 'Advanced AI detection of specific emotions (anger, frustration, joy, etc.)',
        'long_description': 'Go beyond sentiment. Detect specific emotions like frustration, confusion, excitement, and urgency to understand the full emotional context.',
        'category': 'customer_intelligence',
        'icon': 'HeartIcon',
        'monthly_price': 129.00,
        'setup_fee': 0,
        'price_per_call': 0.06,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 15,
        'benefit_summary': 'Understand emotional journey of every customer',
        'use_cases': json.dumps([
            'De-escalation triggers',
            'Empathy coaching',
            'Customer experience mapping'
        ]),
        'roi_metrics': json.dumps({
            'emotion_accuracy': '91%',
            'escalation_reduction': '35%',
            'customer_satisfaction': '+18 CSAT'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 7
    },
    {
        'name': 'Churn Prediction',
        'slug': 'churn-prediction',
        'description': 'Predict customer churn risk based on conversation patterns',
        'long_description': 'Identify at-risk customers before they leave. AI analyzes conversation patterns to predict churn likelihood.',
        'category': 'customer_intelligence',
        'icon': 'ExclamationCircleIcon',
        'monthly_price': 249.00,
        'setup_fee': 99.00,
        'price_per_call': 0.12,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 25,
        'benefit_summary': 'Reduce churn by 30% with early intervention',
        'use_cases': json.dumps([
            'Proactive retention campaigns',
            'Customer success prioritization',
            'Revenue protection'
        ]),
        'roi_metrics': json.dumps({
            'churn_reduction': '30%',
            'prediction_accuracy': '84%',
            'revenue_saved': '$250K+/year'
        }),
        'is_active': True,
        'is_beta': True,
        'requires_approval': False,
        'display_order': 8
    },

    # REVENUE INTELLIGENCE
    {
        'name': 'Intent Detection',
        'slug': 'intent-detection',
        'description': 'Identify caller intent (sales inquiry, support, complaint, etc.)',
        'long_description': 'Route and prioritize calls intelligently. AI determines the purpose of each call for better handling and analytics.',
        'category': 'revenue',
        'icon': 'LightBulbIcon',
        'monthly_price': 99.00,
        'setup_fee': 0,
        'price_per_call': 0.04,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 10,
        'benefit_summary': 'Route calls 3x faster with 96% accuracy',
        'use_cases': json.dumps([
            'Call routing optimization',
            'Lead qualification',
            'Support vs sales classification'
        ]),
        'roi_metrics': json.dumps({
            'routing_accuracy': '96%',
            'time_to_resolution': '-45%',
            'conversion_rate': '+22%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 9
    },
    {
        'name': 'Deal Risk Analysis',
        'slug': 'deal-risk',
        'description': 'Predict deal close probability and identify risk factors',
        'long_description': 'Know which deals need attention. AI analyzes sales conversations to predict close probability and identify obstacles.',
        'category': 'revenue',
        'icon': 'TrendingUpIcon',
        'monthly_price': 199.00,
        'setup_fee': 149.00,
        'price_per_call': 0.10,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 22,
        'benefit_summary': 'Increase win rate by 28% with AI insights',
        'use_cases': json.dumps([
            'Sales pipeline accuracy',
            'Deal coaching',
            'Forecast improvement'
        ]),
        'roi_metrics': json.dumps({
            'win_rate_increase': '28%',
            'forecast_accuracy': '93%',
            'deal_velocity': '+15 days faster'
        }),
        'is_active': True,
        'is_beta': True,
        'requires_approval': False,
        'display_order': 10
    },
    {
        'name': 'Objection Analysis',
        'slug': 'objection-analysis',
        'description': 'Track objections and how effectively they are handled',
        'long_description': 'Master objection handling. AI identifies all objections raised and evaluates how well agents respond.',
        'category': 'revenue',
        'icon': 'ChatAlt2Icon',
        'monthly_price': 179.00,
        'setup_fee': 0,
        'price_per_call': 0.09,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 18,
        'benefit_summary': 'Turn objections into opportunities',
        'use_cases': json.dumps([
            'Sales training',
            'Objection playbook creation',
            'Competitive intelligence'
        ]),
        'roi_metrics': json.dumps({
            'objection_handling': '+45% effectiveness',
            'close_rate': '+19%',
            'training_time': '-60%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 11
    },

    # ANALYTICS
    {
        'name': 'Talk Time Analytics',
        'slug': 'talk-time',
        'description': 'Analyze agent vs customer talk time, interruptions, and silence',
        'long_description': 'Optimize conversation flow. Track who speaks when, detect interruptions, and measure silence for coaching.',
        'category': 'analytics',
        'icon': 'ClockIcon',
        'monthly_price': 69.00,
        'setup_fee': 0,
        'price_per_call': 0.02,
        'requires_openai': False,
        'openai_model': None,
        'processing_time_estimate': 5,
        'benefit_summary': 'Improve conversation quality with data-driven coaching',
        'use_cases': json.dumps([
            'Agent talk time optimization',
            'Active listening coaching',
            'Conversation balance'
        ]),
        'roi_metrics': json.dumps({
            'agent_effectiveness': '+32%',
            'customer_engagement': '+28%',
            'call_efficiency': '15% shorter calls'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 12
    },

    # MULTILINGUAL
    {
        'name': 'Multilingual Transcription',
        'slug': 'multilingual-transcription',
        'description': 'Transcribe calls in 50+ languages with 95%+ accuracy',
        'long_description': 'Break language barriers. Automatic transcription in over 50 languages powered by OpenAI Whisper.',
        'category': 'multilingual',
        'icon': 'TranslateIcon',
        'monthly_price': 0,
        'setup_fee': 0,
        'price_per_call': 0.06,
        'requires_openai': True,
        'openai_model': 'whisper-1',
        'processing_time_estimate': 30,
        'benefit_summary': 'Support global customers in their native language',
        'use_cases': json.dumps([
            'International customer support',
            'Global sales teams',
            'Compliance in multiple markets'
        ]),
        'roi_metrics': json.dumps({
            'language_coverage': '50+ languages',
            'transcription_accuracy': '95%+',
            'market_expansion': 'Unlimited'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 13
    },

    # Additional features (14-24)
    {
        'name': 'Real-Time Agent Assist',
        'slug': 'real-time-assist',
        'description': 'Live AI suggestions and alerts during active calls',
        'long_description': 'Empower agents with real-time AI coaching, knowledge base suggestions, and compliance alerts during live calls.',
        'category': 'real_time',
        'icon': 'LightningBoltIcon',
        'monthly_price': 399.00,
        'setup_fee': 299.00,
        'price_per_call': 0.15,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 1,
        'benefit_summary': 'Boost agent confidence and reduce call time by 20%',
        'use_cases': json.dumps([
            'New agent onboarding',
            'Complex product support',
            'Compliance enforcement'
        ]),
        'roi_metrics': json.dumps({
            'ramp_time_reduction': '50%',
            'first_call_resolution': '+35%',
            'handle_time': '-20%'
        }),
        'is_active': True,
        'is_beta': True,
        'requires_approval': True,
        'display_order': 14
    },
    {
        'name': 'Call Recording & Storage',
        'slug': 'call-recording',
        'description': 'Secure cloud storage for call recordings with encryption',
        'long_description': 'Store all call recordings securely in the cloud with encryption, retention policies, and easy retrieval.',
        'category': 'compliance',
        'icon': 'MicrophoneIcon',
        'monthly_price': 49.00,
        'setup_fee': 0,
        'price_per_call': 0.01,
        'requires_openai': False,
        'openai_model': None,
        'processing_time_estimate': 0,
        'benefit_summary': 'Never lose a call recording again',
        'use_cases': json.dumps([
            'Dispute resolution',
            'Quality assurance',
            'Training materials'
        ]),
        'roi_metrics': json.dumps({
            'storage_reliability': '99.99%',
            'retrieval_time': '<5 seconds',
            'compliance_coverage': '100%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 15
    },
    {
        'name': 'Keyword Spotting',
        'slug': 'keyword-spotting',
        'description': 'Detect specific keywords and phrases across all calls',
        'long_description': 'Find needles in haystacks. Search for any keyword or phrase across your entire call history instantly.',
        'category': 'analytics',
        'icon': 'SearchIcon',
        'monthly_price': 79.00,
        'setup_fee': 0,
        'price_per_call': 0.02,
        'requires_openai': False,
        'openai_model': None,
        'processing_time_estimate': 5,
        'benefit_summary': 'Find critical conversations in seconds',
        'use_cases': json.dumps([
            'Competitor mentions',
            'Product feedback',
            'Compliance keywords'
        ]),
        'roi_metrics': json.dumps({
            'search_speed': '1000x faster',
            'accuracy': '99%',
            'competitive_intel': 'Real-time'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 16
    },
    {
        'name': 'Automated Call Tagging',
        'slug': 'auto-tagging',
        'description': 'AI automatically categorizes and tags calls',
        'long_description': 'No more manual tagging. AI automatically categorizes every call by type, department, product, and priority.',
        'category': 'insights',
        'icon': 'CollectionIcon',
        'monthly_price': 89.00,
        'setup_fee': 0,
        'price_per_call': 0.03,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 8,
        'benefit_summary': 'Save 10 hours/week on manual categorization',
        'use_cases': json.dumps([
            'Call routing analytics',
            'Department performance',
            'Product feedback tracking'
        ]),
        'roi_metrics': json.dumps({
            'tagging_accuracy': '94%',
            'time_saved': '10 hours/week',
            'reporting_improvement': '5x faster'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 17
    },
    {
        'name': 'Customer Journey Mapping',
        'slug': 'journey-mapping',
        'description': 'Track customer interactions across multiple touchpoints',
        'long_description': 'See the complete customer story. Map all interactions across calls, emails, and tickets to understand the full journey.',
        'category': 'customer_intelligence',
        'icon': 'MapIcon',
        'monthly_price': 179.00,
        'setup_fee': 99.00,
        'price_per_call': 0.08,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 12,
        'benefit_summary': 'Understand customer context instantly',
        'use_cases': json.dumps([
            'Customer success planning',
            'Upsell identification',
            'Experience optimization'
        ]),
        'roi_metrics': json.dumps({
            'context_awareness': '100%',
            'upsell_conversion': '+42%',
            'customer_satisfaction': '+31 NPS'
        }),
        'is_active': True,
        'is_beta': True,
        'requires_approval': False,
        'display_order': 18
    },
    {
        'name': 'CRM Auto-Sync',
        'slug': 'crm-sync',
        'description': 'Automatically update CRM with call data and insights',
        'long_description': 'Eliminate manual CRM updates. AI automatically logs calls, notes, and insights to Salesforce, HubSpot, and more.',
        'category': 'integration',
        'icon': 'RefreshIcon',
        'monthly_price': 149.00,
        'setup_fee': 299.00,
        'price_per_call': 0.05,
        'requires_openai': False,
        'openai_model': None,
        'processing_time_estimate': 10,
        'benefit_summary': 'Save 2 hours per agent per day on CRM updates',
        'use_cases': json.dumps([
            'Salesforce integration',
            'HubSpot sync',
            'Custom CRM updates'
        ]),
        'roi_metrics': json.dumps({
            'time_saved': '2 hours/agent/day',
            'crm_accuracy': '100%',
            'adoption_increase': '+89%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': True,
        'display_order': 19
    },
    {
        'name': 'Coaching Recommendations',
        'slug': 'coaching-recommendations',
        'description': 'AI-generated personalized coaching tips for each agent',
        'long_description': 'Personalized coaching at scale. AI analyzes each agent\'s calls to generate specific, actionable coaching recommendations.',
        'category': 'coaching',
        'icon': 'AcademicCapIcon',
        'monthly_price': 199.00,
        'setup_fee': 0,
        'price_per_call': 0.07,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 15,
        'benefit_summary': 'Accelerate agent improvement by 3x',
        'use_cases': json.dumps([
            'Individual development plans',
            'Performance improvement',
            'Skill gap analysis'
        ]),
        'roi_metrics': json.dumps({
            'performance_improvement': '3x faster',
            'coaching_efficiency': '+200%',
            'retention': '+25%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 20
    },
    {
        'name': 'Trend Analysis',
        'slug': 'trend-analysis',
        'description': 'Identify emerging patterns and trends across all calls',
        'long_description': 'Stay ahead of the curve. AI detects emerging trends, common issues, and opportunities across thousands of calls.',
        'category': 'analytics',
        'icon': 'ChartBarIcon',
        'monthly_price': 129.00,
        'setup_fee': 0,
        'price_per_call': 0.05,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 20,
        'benefit_summary': 'Spot trends 4 weeks earlier than manual analysis',
        'use_cases': json.dumps([
            'Product feedback trends',
            'Emerging issues',
            'Market intelligence'
        ]),
        'roi_metrics': json.dumps({
            'trend_detection_speed': '4 weeks earlier',
            'pattern_accuracy': '88%',
            'proactive_fixes': '+150%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 21
    },
    {
        'name': 'Competitive Intelligence',
        'slug': 'competitive-intel',
        'description': 'Track competitor mentions and win/loss reasons',
        'long_description': 'Know your competition. AI tracks all competitor mentions, win/loss reasons, and competitive positioning insights.',
        'category': 'revenue',
        'icon': 'TrendingDownIcon',
        'monthly_price': 249.00,
        'setup_fee': 149.00,
        'price_per_call': 0.10,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 18,
        'benefit_summary': 'Win 35% more competitive deals',
        'use_cases': json.dumps([
            'Win/loss analysis',
            'Competitive positioning',
            'Product roadmap input'
        ]),
        'roi_metrics': json.dumps({
            'win_rate_vs_competitors': '+35%',
            'intel_coverage': '100%',
            'response_time': '10x faster'
        }),
        'is_active': True,
        'is_beta': True,
        'requires_approval': False,
        'display_order': 22
    },
    {
        'name': 'Custom Scorecards',
        'slug': 'custom-scorecards',
        'description': 'Build custom AI scoring criteria for your specific needs',
        'long_description': 'Your business is unique. Create custom AI scorecards that evaluate calls based on your specific processes and requirements.',
        'category': 'coaching',
        'icon': 'ClipboardListIcon',
        'monthly_price': 299.00,
        'setup_fee': 499.00,
        'price_per_call': 0.12,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 25,
        'benefit_summary': 'Enforce your exact standards across all calls',
        'use_cases': json.dumps([
            'Industry-specific compliance',
            'Brand voice enforcement',
            'Custom KPIs'
        ]),
        'roi_metrics': json.dumps({
            'customization': 'Unlimited criteria',
            'consistency': '98%',
            'brand_alignment': '+67%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': True,
        'display_order': 23
    },
    {
        'name': 'Agent Performance Benchmarking',
        'slug': 'benchmarking',
        'description': 'Compare agent performance against team and industry standards',
        'long_description': 'Know where you stand. Compare individual and team performance against benchmarks, peers, and industry standards.',
        'category': 'analytics',
        'icon': 'ScaleIcon',
        'monthly_price': 159.00,
        'setup_fee': 0,
        'price_per_call': 0.06,
        'requires_openai': True,
        'openai_model': 'gpt-4',
        'processing_time_estimate': 15,
        'benefit_summary': 'Identify top performers and replicate success',
        'use_cases': json.dumps([
            'Performance rankings',
            'Best practice identification',
            'Peer learning programs'
        ]),
        'roi_metrics': json.dumps({
            'performance_visibility': '100%',
            'best_practice_adoption': '+73%',
            'team_performance': '+41%'
        }),
        'is_active': True,
        'is_beta': False,
        'requires_approval': False,
        'display_order': 24
    }
]

def create_super_admin(conn):
    """Create super admin if not exists"""
    print("👤 Checking for super admin...")

    result = conn.execute(text("""
        SELECT id, email FROM managers WHERE email = 'superadmin@audia.com'
    """))
    existing = result.fetchone()

    if existing:
        print(f"   ✅ Super admin exists (ID: {existing[0]})")
        return existing[0]

    print("   Creating super admin...")
    password_hash = generate_password_hash("SuperAdmin123!")

    result = conn.execute(text("""
        INSERT INTO managers (email, password, full_name, is_super_admin, created_at)
        VALUES (:email, :password, :full_name, TRUE, NOW())
        RETURNING id
    """), {
        "email": "superadmin@audia.com",
        "password": password_hash,
        "full_name": "Super Administrator"
    })

    manager_id = result.fetchone()[0]
    print(f"   ✅ Super admin created (ID: {manager_id})")
    return manager_id

def seed_ai_features(conn):
    """Seed all 24 AI features"""
    print("\n🎯 Seeding AI features...")

    created_count = 0
    updated_count = 0

    for feature_data in FEATURES_DATA:
        # Check if feature exists
        result = conn.execute(text("""
            SELECT id FROM ai_features WHERE slug = :slug
        """), {"slug": feature_data['slug']})

        existing = result.fetchone()

        if existing:
            # Update existing feature
            conn.execute(text("""
                UPDATE ai_features SET
                    name = :name,
                    description = :description,
                    long_description = :long_description,
                    category = :category,
                    icon = :icon,
                    monthly_price = :monthly_price,
                    setup_fee = :setup_fee,
                    price_per_call = :price_per_call,
                    requires_openai = :requires_openai,
                    openai_model = :openai_model,
                    processing_time_estimate = :processing_time_estimate,
                    benefit_summary = :benefit_summary,
                    use_cases = :use_cases,
                    roi_metrics = :roi_metrics,
                    is_active = :is_active,
                    is_beta = :is_beta,
                    requires_approval = :requires_approval,
                    display_order = :display_order,
                    updated_at = NOW()
                WHERE slug = :slug
            """), feature_data)
            updated_count += 1
            print(f"   ↻ Updated: {feature_data['name']}")
        else:
            # Insert new feature
            conn.execute(text("""
                INSERT INTO ai_features (
                    name, slug, description, long_description, category, icon,
                    monthly_price, setup_fee, price_per_call, requires_openai,
                    openai_model, processing_time_estimate, benefit_summary,
                    use_cases, roi_metrics, is_active, is_beta, requires_approval,
                    display_order, created_at, updated_at
                ) VALUES (
                    :name, :slug, :description, :long_description, :category, :icon,
                    :monthly_price, :setup_fee, :price_per_call, :requires_openai,
                    :openai_model, :processing_time_estimate, :benefit_summary,
                    :use_cases, :roi_metrics, :is_active, :is_beta, :requires_approval,
                    :display_order, NOW(), NOW()
                )
            """), feature_data)
            created_count += 1
            print(f"   ✅ Created: {feature_data['name']}")

    print(f"\n   📊 Summary: {created_count} created, {updated_count} updated")

def verify_features(conn):
    """Verify features were created"""
    print("\n🔍 Verifying features...")

    result = conn.execute(text("""
        SELECT category, COUNT(*) as count
        FROM ai_features
        WHERE is_active = TRUE
        GROUP BY category
        ORDER BY category
    """))

    total = 0
    for row in result:
        print(f"   {row[0]}: {row[1]} features")
        total += row[1]

    print(f"\n   ✅ Total: {total} active features")
    return total

if __name__ == '__main__':
    try:
        print("🚀 AudiaPro AI Features Setup\n")
        print("=" * 50)

        with engine.connect() as conn:
            # Step 1: Create super admin
            manager_id = create_super_admin(conn)

            # Step 2: Seed AI features
            seed_ai_features(conn)

            # Step 3: Verify
            total_features = verify_features(conn)

            # Commit all changes
            conn.commit()

        print("\n" + "=" * 50)
        print("✅ Setup Complete!\n")

        print("📝 Super Admin Credentials:")
        print("   URL: https://timhayes-bo-production-58c5.up.railway.app/super-admin")
        print("   Email: superadmin@audia.com")
        print("   Password: SuperAdmin123!")
        print("   ⚠️  Change password after first login!\n")

        print("🎯 AI Features:")
        print(f"   {total_features} features now available")
        print("   View at: https://timhayes-bo-production-58c5.up.railway.app/features\n")

        print("📚 Next Steps:")
        print("   1. Login to super admin panel")
        print("   2. Go to Tenant Detail page")
        print("   3. Enable AI features for test tenant")
        print("   4. Add OPENAI_API_KEY to Railway environment")
        print("   5. Test AI processing on a call\n")

        print("🎉 Your fully customizable AI platform is ready!\n")

    except Exception as e:
        print(f"\n❌ Setup failed: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
