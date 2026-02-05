"""
Pre-built outcome scenarios for prompt refinement.
Users can select these scenarios instead of typing custom requests.
"""

PROMPT_SCENARIOS = {
    'sentiment-analysis': [
        {
            'id': 'sentiment-sensitive-frustration',
            'title': 'More Sensitive to Frustration',
            'description': 'Detect frustration and dissatisfaction earlier and more accurately',
            'request': 'Make the sentiment analysis more sensitive to signs of customer frustration, dissatisfaction, and subtle negative cues. Detect frustration earlier in conversations.',
            'category': 'sensitivity',
            'impact': 'high'
        },
        {
            'id': 'sentiment-positive-focus',
            'title': 'Emphasize Positive Signals',
            'description': 'Give more weight to positive sentiment indicators',
            'request': 'Adjust the sentiment analysis to give more weight to positive indicators like excitement, satisfaction, and enthusiasm. Highlight when customers express genuine interest.',
            'category': 'emphasis',
            'impact': 'medium'
        },
        {
            'id': 'sentiment-neutral-conservative',
            'title': 'More Conservative (Fewer Extremes)',
            'description': 'Avoid over-classifying as very positive or very negative',
            'request': 'Make sentiment scoring more conservative, avoiding extremes. Only mark sentiment as very positive or very negative when there is strong evidence.',
            'category': 'calibration',
            'impact': 'medium'
        },
        {
            'id': 'sentiment-track-shifts',
            'title': 'Focus on Sentiment Shifts',
            'description': 'Emphasize tracking how sentiment changes during the call',
            'request': 'Focus more on tracking sentiment shifts throughout the call. Identify key moments where sentiment changed and what triggered those changes.',
            'category': 'tracking',
            'impact': 'high'
        }
    ],

    'quality-scoring': [
        {
            'id': 'quality-strict-professionalism',
            'title': 'Stricter Professionalism Standards',
            'description': 'Higher bar for professional communication',
            'request': 'Make the quality scoring significantly stricter on professionalism. Penalize casual language, filler words, and unprofessional tone more heavily.',
            'category': 'strictness',
            'impact': 'high'
        },
        {
            'id': 'quality-empathy-focus',
            'title': 'Emphasize Empathy & Rapport',
            'description': 'Give more weight to empathy and relationship building',
            'request': 'Increase the importance of empathy and rapport-building in quality scores. Reward active listening, empathetic responses, and personal connection.',
            'category': 'emphasis',
            'impact': 'high'
        },
        {
            'id': 'quality-objection-handling',
            'title': 'Focus on Objection Handling',
            'description': 'Make objection handling more important in overall score',
            'request': 'Give more weight to objection handling in the overall quality score. Evaluate how well reps address concerns and overcome resistance.',
            'category': 'emphasis',
            'impact': 'medium'
        },
        {
            'id': 'quality-opening-closing',
            'title': 'Strict Opening & Closing',
            'description': 'Higher standards for call beginnings and endings',
            'request': 'Be more strict about strong openings and closings. Require clear introductions, agenda setting, and proper next-step commitments.',
            'category': 'strictness',
            'impact': 'medium'
        }
    ],

    'objection-analysis': [
        {
            'id': 'objection-price-focus',
            'title': 'Emphasize Price Objections',
            'description': 'Focus specifically on pricing-related concerns',
            'request': 'Focus the objection analysis specifically on price-related objections. Identify all pricing concerns, budget mentions, and cost hesitations with detailed analysis.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'objection-timing-concerns',
            'title': 'Track Timing & Urgency Objections',
            'description': 'Identify "not right now" and timing-related pushback',
            'request': 'Pay special attention to timing objections like "not right now", "need to wait", or "check back later". Analyze urgency-related concerns.',
            'category': 'focus',
            'impact': 'medium'
        },
        {
            'id': 'objection-effectiveness-strict',
            'title': 'Stricter Objection Handling Evaluation',
            'description': 'Higher bar for what counts as effective objection handling',
            'request': 'Be more strict in evaluating objection handling effectiveness. Only mark responses as "handled well" if they truly address the root concern.',
            'category': 'strictness',
            'impact': 'high'
        },
        {
            'id': 'objection-hidden-concerns',
            'title': 'Detect Hidden Objections',
            'description': 'Identify unstated concerns and hesitations',
            'request': 'Focus on detecting hidden or unstated objections. Identify when customers have concerns they are not explicitly voicing.',
            'category': 'detection',
            'impact': 'high'
        }
    ],

    'churn-prediction': [
        {
            'id': 'churn-early-warning',
            'title': 'More Sensitive Early Warning',
            'description': 'Detect churn risk earlier with subtle signals',
            'request': 'Make churn prediction more sensitive to early warning signs. Detect subtle indicators of dissatisfaction that could lead to churn.',
            'category': 'sensitivity',
            'impact': 'high'
        },
        {
            'id': 'churn-competitor-mentions',
            'title': 'Flag Competitor Mentions',
            'description': 'Emphasize when competitors are mentioned',
            'request': 'Give high weight to competitor mentions in churn risk scoring. Flag any discussion of alternative solutions or competitor evaluation.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'churn-usage-concerns',
            'title': 'Track Usage & Engagement Issues',
            'description': 'Focus on product usage and engagement concerns',
            'request': 'Focus churn prediction on usage-related concerns: lack of adoption, feature confusion, or low engagement signals.',
            'category': 'focus',
            'impact': 'medium'
        }
    ],

    'deal-risk': [
        {
            'id': 'deal-decision-maker-focus',
            'title': 'Emphasize Decision Maker Access',
            'description': 'Flag lack of decision maker involvement',
            'request': 'Make deal risk scoring heavily weight whether the decision maker is involved. Flag deals where we are not speaking to the real decision maker.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'deal-timeline-clarity',
            'title': 'Require Clear Timeline',
            'description': 'Flag vague or missing timelines as high risk',
            'request': 'Treat vague timelines as a major deal risk factor. Deals without clear next steps or decision dates should be flagged as higher risk.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'deal-budget-confirmation',
            'title': 'Flag Missing Budget Discussion',
            'description': 'Increase risk when budget is not confirmed',
            'request': 'Increase deal risk when budget has not been discussed or confirmed. Lack of budget conversation should be a red flag.',
            'category': 'focus',
            'impact': 'medium'
        }
    ],

    'compliance-monitoring': [
        {
            'id': 'compliance-strict-claims',
            'title': 'Strict on Absolute Claims',
            'description': 'Flag any guarantees, promises, or absolute statements',
            'request': 'Be very strict about absolute claims. Flag any use of "guarantee", "promise", "definitely", "always", or similar absolute language.',
            'category': 'strictness',
            'impact': 'high'
        },
        {
            'id': 'compliance-privacy-focus',
            'title': 'Emphasize Privacy & Security',
            'description': 'Focus on data privacy and security discussions',
            'request': 'Pay special attention to privacy and security compliance. Flag any improper handling of sensitive data or PII.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'compliance-disclosure-requirements',
            'title': 'Track Required Disclosures',
            'description': 'Ensure mandatory disclosures are made',
            'request': 'Track that all required disclosures are made during calls. Flag missing terms, conditions, or legal disclaimers.',
            'category': 'tracking',
            'impact': 'medium'
        }
    ],

    'call-summaries': [
        {
            'id': 'summary-action-focus',
            'title': 'Focus on Action Items',
            'description': 'Emphasize next steps and commitments in summaries',
            'request': 'Make call summaries focus heavily on action items, next steps, and commitments from both parties.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'summary-key-moments',
            'title': 'Highlight Key Moments',
            'description': 'Identify and emphasize critical conversation points',
            'request': 'Focus summaries on identifying and highlighting key moments: breakthroughs, objections, commitments, and turning points.',
            'category': 'emphasis',
            'impact': 'medium'
        },
        {
            'id': 'summary-concise',
            'title': 'More Concise Summaries',
            'description': 'Generate shorter, more focused summaries',
            'request': 'Make summaries more concise. Focus on the most critical information only, removing unnecessary details.',
            'category': 'style',
            'impact': 'medium'
        }
    ],

    'emotion-detection': [
        {
            'id': 'emotion-frustration-sensitive',
            'title': 'More Sensitive to Frustration',
            'description': 'Detect frustration earlier and more accurately',
            'request': 'Make emotion detection more sensitive to frustration signals. Detect frustration earlier, including subtle signs.',
            'category': 'sensitivity',
            'impact': 'high'
        },
        {
            'id': 'emotion-excitement-tracking',
            'title': 'Track Excitement & Interest',
            'description': 'Better detection of customer excitement and buying signals',
            'request': 'Improve detection of excitement, enthusiasm, and genuine interest. Identify buying signals and positive emotional engagement.',
            'category': 'focus',
            'impact': 'high'
        }
    ],

    'intent-detection': [
        {
            'id': 'intent-buying-signals',
            'title': 'Focus on Buying Intent',
            'description': 'Better detection of purchase readiness',
            'request': 'Focus intent detection on identifying buying signals and purchase readiness. Distinguish between research and ready-to-buy intent.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'intent-cancellation-early',
            'title': 'Early Cancellation Detection',
            'description': 'Detect cancellation intent as early as possible',
            'request': 'Make intent detection highly sensitive to cancellation signals. Detect cancellation intent early, even when unstated.',
            'category': 'sensitivity',
            'impact': 'high'
        }
    ],

    'action-items': [
        {
            'id': 'action-accountability',
            'title': 'Clear Accountability',
            'description': 'Ensure every action item has a clear owner',
            'request': 'Require clear accountability for every action item. Flag vague commitments that lack a specific owner or timeline.',
            'category': 'strictness',
            'impact': 'high'
        },
        {
            'id': 'action-timeline-specific',
            'title': 'Specific Timelines Required',
            'description': 'Flag action items without specific deadlines',
            'request': 'Be strict about requiring specific timelines. Flag action items with vague timing like "soon" or "later".',
            'category': 'strictness',
            'impact': 'medium'
        }
    ],

    'topic-extraction': [
        {
            'id': 'topic-pain-points',
            'title': 'Emphasize Pain Points',
            'description': 'Focus on customer challenges and problems discussed',
            'request': 'Make topic extraction focus heavily on pain points, challenges, and problems mentioned by the customer.',
            'category': 'focus',
            'impact': 'high'
        },
        {
            'id': 'topic-competitor-mentions',
            'title': 'Track Competitor Mentions',
            'description': 'Identify all competitor and alternative solution discussions',
            'request': 'Focus on extracting topics related to competitors, alternatives, and comparison shopping.',
            'category': 'focus',
            'impact': 'medium'
        }
    ]
}


def get_scenarios_for_feature(feature_slug):
    """Get all pre-built scenarios for a specific AI feature"""
    return PROMPT_SCENARIOS.get(feature_slug, [])


def get_scenario_by_id(scenario_id):
    """Find a specific scenario by its ID across all features"""
    for feature_slug, scenarios in PROMPT_SCENARIOS.items():
        for scenario in scenarios:
            if scenario['id'] == scenario_id:
                return {
                    **scenario,
                    'feature_slug': feature_slug
                }
    return None


def get_all_scenarios():
    """Get all scenarios organized by feature"""
    return PROMPT_SCENARIOS


def get_scenario_categories():
    """Get all unique scenario categories"""
    categories = set()
    for scenarios in PROMPT_SCENARIOS.values():
        for scenario in scenarios:
            categories.add(scenario['category'])
    return sorted(list(categories))
