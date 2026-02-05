"""
Seed the database with the 24 AI features
Run this script to populate the AIFeature table
"""

import os
from app import app, db, AIFeature

# The 24 AI features organized by category
AI_FEATURES = [
    # Coaching & Development (5 features)
    {
        'slug': 'call-summaries',
        'name': 'Call Summaries',
        'description': 'Automated call summaries with key points and outcomes',
        'category': 'coaching',
        'monthly_price': 49.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 1
    },
    {
        'slug': 'quality-scoring',
        'name': 'Quality Scoring',
        'description': 'Automated quality scores based on best practices',
        'category': 'coaching',
        'monthly_price': 79.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 2
    },
    {
        'slug': 'coaching-tips',
        'name': 'Coaching Tips',
        'description': 'AI-generated coaching recommendations',
        'category': 'coaching',
        'monthly_price': 59.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 3
    },
    {
        'slug': 'next-best-actions',
        'name': 'Next Best Actions',
        'description': 'Recommended follow-up actions based on call analysis',
        'category': 'coaching',
        'monthly_price': 69.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 4
    },
    {
        'slug': 'talk-listen-ratio',
        'name': 'Talk/Listen Ratio',
        'description': 'Analysis of conversation balance',
        'category': 'coaching',
        'monthly_price': 39.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 5
    },

    # Automated Insights (4 features)
    {
        'slug': 'action-items',
        'name': 'Action Items',
        'description': 'Automatically extract action items and commitments',
        'category': 'insights',
        'monthly_price': 59.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 6
    },
    {
        'slug': 'topic-detection',
        'name': 'Topic Detection',
        'description': 'Identify main topics and themes discussed',
        'category': 'insights',
        'monthly_price': 69.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 7
    },
    {
        'slug': 'keyword-tracking',
        'name': 'Keyword Tracking',
        'description': 'Track custom keywords and phrases',
        'category': 'insights',
        'monthly_price': 49.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 8
    },
    {
        'slug': 'trend-analysis',
        'name': 'Trend Analysis',
        'description': 'Identify trends across multiple calls',
        'category': 'insights',
        'monthly_price': 89.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 9
    },

    # Customer Intelligence (6 features)
    {
        'slug': 'sentiment-analysis',
        'name': 'Sentiment Analysis',
        'description': 'Real-time sentiment detection and tracking',
        'category': 'customer_intelligence',
        'monthly_price': 79.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 10
    },
    {
        'slug': 'emotion-detection',
        'name': 'Emotion Detection',
        'description': 'Detect specific emotions (frustration, satisfaction, etc.)',
        'category': 'customer_intelligence',
        'monthly_price': 89.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 11
    },
    {
        'slug': 'churn-risk',
        'name': 'Churn Risk Detection',
        'description': 'Predict customer churn likelihood',
        'category': 'customer_intelligence',
        'monthly_price': 129.00,
        'setup_fee': 50,
        'is_beta': False,
        'display_order': 12
    },
    {
        'slug': 'objection-analysis',
        'name': 'Objection Analysis',
        'description': 'Identify and categorize customer objections',
        'category': 'customer_intelligence',
        'monthly_price': 99.00,
        'setup_fee': 0,
        'is_beta': False,
        'display_order': 13
    },
    {
        'slug': 'deal-risk',
        'name': 'Deal Risk Scoring',
        'description': 'Assess risk level for sales opportunities',
        'category': 'customer_intelligence',
        'monthly_price': 119.00,
        'setup_fee': 50,
        'is_beta': False,
        'display_order': 14
    },
    {
        'slug': 'buyer-intent',
        'name': 'Buyer Intent Signals',
        'description': 'Detect buying signals and intent indicators',
        'category': 'customer_intelligence',
        'monthly_price': 109.00,
        'setup_fee': 25,
        'is_beta': False,
        'display_order': 15
    },

    # Real-Time AI (3 features)
    {
        'slug': 'live-transcription',
        'name': 'Live Transcription',
        'description': 'Real-time speech-to-text during calls',
        'category': 'real_time',
        'monthly_price': 149.00,
        'setup_fee': 100,
        'is_beta': True,
        'display_order': 16
    },
    {
        'slug': 'live-prompts',
        'name': 'Live Agent Prompts',
        'description': 'Real-time suggestions during active calls',
        'category': 'real_time',
        'monthly_price': 199.00,
        'setup_fee': 150,
        'is_beta': True,
        'display_order': 17
    },
    {
        'slug': 'battle-cards',
        'name': 'Battle Cards',
        'description': 'Competitive intel and talking points in real-time',
        'category': 'real_time',
        'monthly_price': 129.00,
        'setup_fee': 75,
        'is_beta': True,
        'display_order': 18
    },

    # Advanced Analytics (3 features)
    {
        'slug': 'custom-scorecards',
        'name': 'Custom Scorecards',
        'description': 'Create custom evaluation criteria',
        'category': 'analytics',
        'monthly_price': 89.00,
        'setup_fee': 50,
        'is_beta': False,
        'display_order': 19
    },
    {
        'slug': 'call-forecasting',
        'name': 'Call Forecasting',
        'description': 'Predict call outcomes and success rates',
        'category': 'analytics',
        'monthly_price': 139.00,
        'setup_fee': 100,
        'is_beta': True,
        'display_order': 20
    },
    {
        'slug': 'pipeline-insights',
        'name': 'Pipeline Insights',
        'description': 'AI-driven pipeline analysis and recommendations',
        'category': 'analytics',
        'monthly_price': 159.00,
        'setup_fee': 100,
        'is_beta': False,
        'display_order': 21
    },

    # Multilingual & Global (2 features)
    {
        'slug': 'multi-language',
        'name': 'Multi-Language Support',
        'description': 'Transcription and analysis in 50+ languages',
        'category': 'multilingual',
        'monthly_price': 199.00,
        'setup_fee': 150,
        'is_beta': False,
        'display_order': 22
    },
    {
        'slug': 'accent-detection',
        'name': 'Accent & Dialect Detection',
        'description': 'Identify regional accents and dialects',
        'category': 'multilingual',
        'monthly_price': 89.00,
        'setup_fee': 50,
        'is_beta': True,
        'display_order': 23
    },

    # Integration Intelligence (1 feature)
    {
        'slug': 'crm-sync',
        'name': 'Smart CRM Sync',
        'description': 'Automatic CRM updates with call insights',
        'category': 'integration',
        'monthly_price': 99.00,
        'setup_fee': 100,
        'is_beta': False,
        'display_order': 24
    }
]


def seed_ai_features():
    """Seed the database with AI features"""
    with app.app_context():
        print("Starting AI features seed...")

        # Check if features already exist
        existing_count = AIFeature.query.count()
        if existing_count > 0:
            print(f"WARNING: Database already has {existing_count} features.")
            response = input("Do you want to clear and re-seed? (yes/no): ")
            if response.lower() != 'yes':
                print("Seed cancelled.")
                return

            # Clear existing features
            print("Clearing existing features...")
            AIFeature.query.delete()
            db.session.commit()

        # Insert features
        print(f"Inserting {len(AI_FEATURES)} AI features...")
        for feature_data in AI_FEATURES:
            feature = AIFeature(**feature_data)
            db.session.add(feature)

        db.session.commit()
        print(f"SUCCESS: Seeded {len(AI_FEATURES)} AI features!")

        # Print summary
        print("\nFeatures by category:")
        categories = {}
        for feature in AI_FEATURES:
            cat = feature['category']
            if cat not in categories:
                categories[cat] = 0
            categories[cat] += 1

        for cat, count in categories.items():
            print(f"  - {cat}: {count} features")


if __name__ == '__main__':
    seed_ai_features()
