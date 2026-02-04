#!/usr/bin/env python3
"""
Create test call data for testing analytics
Run this after creating your first tenant to populate the dashboard with sample data
"""

from app import app, db, Tenant, CallRecord, SentimentAnalysis
from datetime import datetime, timedelta
import random

def create_test_data(tenant_subdomain='demo', num_calls=50):
    """Create test call records for a tenant"""

    with app.app_context():
        # Get the tenant
        tenant = Tenant.query.filter_by(subdomain=tenant_subdomain).first()

        if not tenant:
            print(f"❌ No '{tenant_subdomain}' tenant found!")
            print("Create a tenant with this subdomain first through the super admin panel")
            return

        print(f"✅ Found tenant: {tenant.company_name} (ID: {tenant.id})")
        print(f"Creating {num_calls} test call records...")

        # Call data options
        call_outcomes = ['answered', 'no-answer', 'busy', 'failed']
        sentiments = ['positive', 'neutral', 'negative']

        # Area codes for variety
        area_codes = ['555', '212', '415', '312', '617', '310']

        calls_created = 0
        sentiments_created = 0

        for i in range(num_calls):
            # Random date in last 60 days with more recent calls
            days_ago = int(random.triangular(0, 60, 5))  # Bias toward recent
            hours_ago = random.randint(0, 23)
            call_date = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

            # Generate phone numbers
            caller_area = random.choice(area_codes)
            called_area = random.choice(area_codes)
            caller_number = f"+1{caller_area}{random.randint(1000000, 9999999)}"
            called_number = f"+1{called_area}{random.randint(1000000, 9999999)}"

            # Call outcome and duration
            outcome = random.choice(call_outcomes)

            # Answered calls have longer duration
            if outcome == 'answered':
                duration = random.randint(30, 1800)  # 30s to 30min
            elif outcome == 'no-answer':
                duration = random.randint(15, 45)    # Ring time
            else:
                duration = 0

            # Create call record
            call = CallRecord(
                tenant_id=tenant.id,
                call_id=f"test-{tenant_subdomain}-{i}-{random.randint(10000, 99999)}",
                caller_number=caller_number,
                called_number=called_number,
                call_type='inbound' if random.random() > 0.4 else 'outbound',
                call_outcome=outcome,
                call_duration=duration,
                timestamp=call_date
            )
            db.session.add(call)
            calls_created += 1

            # Add sentiment for answered calls (70% chance)
            if outcome == 'answered' and random.random() > 0.3:
                sentiment_type = random.choice(sentiments)

                # Generate realistic scores based on sentiment
                if sentiment_type == 'positive':
                    positive = random.uniform(0.6, 0.95)
                    negative = random.uniform(0.0, 0.2)
                    neutral = 1.0 - positive - negative
                    confidence = random.uniform(0.75, 0.95)
                elif sentiment_type == 'negative':
                    negative = random.uniform(0.6, 0.95)
                    positive = random.uniform(0.0, 0.2)
                    neutral = 1.0 - positive - negative
                    confidence = random.uniform(0.7, 0.9)
                else:  # neutral
                    neutral = random.uniform(0.5, 0.8)
                    remaining = 1.0 - neutral
                    positive = remaining * random.uniform(0.3, 0.7)
                    negative = remaining - positive
                    confidence = random.uniform(0.6, 0.85)

                sentiment = SentimentAnalysis(
                    call_record=call,
                    sentiment=sentiment_type,
                    confidence=confidence,
                    positive_score=positive,
                    negative_score=negative,
                    neutral_score=neutral
                )
                db.session.add(sentiment)
                sentiments_created += 1

        # Commit all at once
        try:
            db.session.commit()
            print(f"\n✅ SUCCESS!")
            print(f"   Created {calls_created} call records")
            print(f"   Created {sentiments_created} sentiment analyses")
            print(f"\n🔍 Check your dashboard at: http://{tenant_subdomain}.localhost:5173")
            print(f"   Or Railway: https://{tenant_subdomain}.your-domain.com")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error creating test data: {e}")

if __name__ == '__main__':
    import sys

    print("=" * 60)
    print("AudiaPro Test Data Generator")
    print("=" * 60)
    print()

    # Get tenant subdomain from command line or use default
    subdomain = sys.argv[1] if len(sys.argv) > 1 else 'demo'
    num_calls = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    create_test_data(subdomain, num_calls)

    print()
    print("=" * 60)
    print("Usage: python test_data.py [subdomain] [num_calls]")
    print("Example: python test_data.py demo 100")
    print("=" * 60)
