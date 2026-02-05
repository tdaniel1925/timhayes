#!/usr/bin/env python3
"""
Business Management Tables Migration Script
Adds all super admin business management tables to the database

Run this script to add business management features:
    python migrate_business_tables.py
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from datetime import datetime

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL') or "postgresql://postgres:jbleFfJMAiljcizINgmQtYOSaUTuuKSK@yamabiko.proxy.rlwy.net:26726/railway"

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

def table_exists(table_name):
    """Check if a table exists"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return table_name in tables

def run_migration():
    """Run all business management table migrations"""
    print("\nStarting business management migration...\n")

    migrations = []

    with engine.connect() as conn:
        # Migration 1: Create plans table
        if not table_exists('plans'):
            print("  [+] Creating plans table...")
            conn.execute(text("""
                CREATE TABLE plans (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    monthly_price FLOAT NOT NULL DEFAULT 0,
                    annual_price FLOAT,
                    setup_fee FLOAT DEFAULT 0,
                    max_calls_per_month INTEGER DEFAULT 100,
                    max_users INTEGER DEFAULT 5,
                    max_storage_gb INTEGER DEFAULT 10,
                    max_recording_minutes INTEGER DEFAULT 1000,
                    has_api_access BOOLEAN DEFAULT FALSE,
                    has_white_label BOOLEAN DEFAULT FALSE,
                    has_priority_support BOOLEAN DEFAULT FALSE,
                    has_custom_branding BOOLEAN DEFAULT FALSE,
                    trial_days INTEGER DEFAULT 14,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_public BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created plans table")
            print("     [OK] plans table created")
        else:
            print("  [SKIP]  plans table already exists")

        # Migration 2: Create plan_features table
        if not table_exists('plan_features'):
            print("  [+] Creating plan_features table...")
            conn.execute(text("""
                CREATE TABLE plan_features (
                    id SERIAL PRIMARY KEY,
                    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
                    ai_feature_id INTEGER NOT NULL REFERENCES ai_features(id) ON DELETE CASCADE,
                    monthly_quota INTEGER,
                    is_unlimited BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(plan_id, ai_feature_id)
                )
            """))
            migrations.append("Created plan_features table")
            print("     [OK] plan_features table created")
        else:
            print("  [SKIP]  plan_features table already exists")

        # Migration 3: Create subscriptions table
        if not table_exists('subscriptions'):
            print("  [+] Creating subscriptions table...")
            conn.execute(text("""
                CREATE TABLE subscriptions (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
                    plan_id INTEGER NOT NULL REFERENCES plans(id),
                    status VARCHAR(50) DEFAULT 'trialing',
                    billing_cycle VARCHAR(20) DEFAULT 'monthly',
                    current_period_start TIMESTAMP DEFAULT NOW(),
                    current_period_end TIMESTAMP,
                    trial_start TIMESTAMP,
                    trial_end TIMESTAMP,
                    payment_method VARCHAR(50),
                    payment_gateway_id VARCHAR(200),
                    last_payment_date TIMESTAMP,
                    next_billing_date TIMESTAMP,
                    cancel_at_period_end BOOLEAN DEFAULT FALSE,
                    canceled_at TIMESTAMP,
                    cancellation_reason TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created subscriptions table")
            print("     [OK] subscriptions table created")
        else:
            print("  [SKIP]  subscriptions table already exists")

        # Migration 4: Create revenue_metrics table
        if not table_exists('revenue_metrics'):
            print("  [+] Creating revenue_metrics table...")
            conn.execute(text("""
                CREATE TABLE revenue_metrics (
                    id SERIAL PRIMARY KEY,
                    date DATE UNIQUE NOT NULL,
                    mrr FLOAT DEFAULT 0,
                    arr FLOAT DEFAULT 0,
                    total_revenue FLOAT DEFAULT 0,
                    total_tenants INTEGER DEFAULT 0,
                    active_tenants INTEGER DEFAULT 0,
                    trial_tenants INTEGER DEFAULT 0,
                    churned_tenants INTEGER DEFAULT 0,
                    new_tenants INTEGER DEFAULT 0,
                    new_paying_tenants INTEGER DEFAULT 0,
                    churn_rate FLOAT DEFAULT 0,
                    ltv FLOAT DEFAULT 0,
                    starter_mrr FLOAT DEFAULT 0,
                    professional_mrr FLOAT DEFAULT 0,
                    enterprise_mrr FLOAT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created revenue_metrics table")
            print("     [OK] revenue_metrics table created")
        else:
            print("  [SKIP]  revenue_metrics table already exists")

        # Migration 5: Create system_metrics table
        if not table_exists('system_metrics'):
            print("  [+] Creating system_metrics table...")
            conn.execute(text("""
                CREATE TABLE system_metrics (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP NOT NULL,
                    metric_type VARCHAR(50) NOT NULL,
                    tenant_id INTEGER REFERENCES tenants(id),
                    value FLOAT NOT NULL,
                    unit VARCHAR(20),
                    details TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            conn.execute(text("""
                CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp)
            """))
            conn.execute(text("""
                CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type)
            """))
            migrations.append("Created system_metrics table with indexes")
            print("     [OK] system_metrics table created with indexes")
        else:
            print("  [SKIP]  system_metrics table already exists")

        # Migration 6: Create call_metrics table
        if not table_exists('call_metrics'):
            print("  [+] Creating call_metrics table...")
            conn.execute(text("""
                CREATE TABLE call_metrics (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    transcription_cost FLOAT DEFAULT 0,
                    analysis_cost FLOAT DEFAULT 0,
                    storage_cost FLOAT DEFAULT 0,
                    total_cost FLOAT DEFAULT 0,
                    processing_time_seconds FLOAT,
                    transcription_time FLOAT,
                    analysis_time FLOAT,
                    audio_quality_score FLOAT,
                    transcription_confidence FLOAT,
                    is_sales_call BOOLEAN DEFAULT FALSE,
                    is_support_call BOOLEAN DEFAULT FALSE,
                    has_action_items BOOLEAN DEFAULT FALSE,
                    has_compliance_alert BOOLEAN DEFAULT FALSE,
                    agent_talk_time_percent FLOAT,
                    customer_talk_time_percent FLOAT,
                    silence_time_percent FLOAT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created call_metrics table")
            print("     [OK] call_metrics table created")
        else:
            print("  [SKIP]  call_metrics table already exists")

        # Migration 7: Create feature_flags table
        if not table_exists('feature_flags'):
            print("  [+] Creating feature_flags table...")
            conn.execute(text("""
                CREATE TABLE feature_flags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    is_enabled BOOLEAN DEFAULT FALSE,
                    rollout_percentage INTEGER DEFAULT 0,
                    target_plan_ids TEXT,
                    target_tenant_ids TEXT,
                    created_by VARCHAR(200),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created feature_flags table")
            print("     [OK] feature_flags table created")
        else:
            print("  [SKIP]  feature_flags table already exists")

        # Migration 8: Create usage_quotas table
        if not table_exists('usage_quotas'):
            print("  [+] Creating usage_quotas table...")
            conn.execute(text("""
                CREATE TABLE usage_quotas (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    period_start TIMESTAMP NOT NULL,
                    period_end TIMESTAMP NOT NULL,
                    calls_used INTEGER DEFAULT 0,
                    calls_limit INTEGER NOT NULL,
                    transcription_minutes_used FLOAT DEFAULT 0,
                    transcription_minutes_limit FLOAT NOT NULL,
                    storage_gb_used FLOAT DEFAULT 0,
                    storage_gb_limit FLOAT NOT NULL,
                    api_requests_used INTEGER DEFAULT 0,
                    api_requests_limit INTEGER NOT NULL,
                    overage_calls INTEGER DEFAULT 0,
                    overage_cost FLOAT DEFAULT 0,
                    quota_exceeded BOOLEAN DEFAULT FALSE,
                    warning_sent BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            conn.execute(text("""
                CREATE INDEX idx_usage_quota_tenant_period ON usage_quotas(tenant_id, period_start)
            """))
            migrations.append("Created usage_quotas table with index")
            print("     [OK] usage_quotas table created with index")
        else:
            print("  [SKIP]  usage_quotas table already exists")

        # Migration 9: Create system_alerts table
        if not table_exists('system_alerts'):
            print("  [+] Creating system_alerts table...")
            conn.execute(text("""
                CREATE TABLE system_alerts (
                    id SERIAL PRIMARY KEY,
                    alert_type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) DEFAULT 'warning',
                    title VARCHAR(200) NOT NULL,
                    message TEXT,
                    tenant_id INTEGER REFERENCES tenants(id),
                    metric_value FLOAT,
                    threshold_value FLOAT,
                    is_resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TIMESTAMP,
                    resolved_by VARCHAR(200),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            conn.execute(text("""
                CREATE INDEX idx_system_alerts_unresolved ON system_alerts(is_resolved, created_at)
            """))
            migrations.append("Created system_alerts table with index")
            print("     [OK] system_alerts table created with index")
        else:
            print("  [SKIP]  system_alerts table already exists")

        # Commit all changes
        conn.commit()

    print(f"\n[OK] Migration complete! {len(migrations)} changes applied:")
    for i, migration in enumerate(migrations, 1):
        print(f"   {i}. {migration}")

    if not migrations:
        print("   [INFO]  No migrations needed - database is up to date")

    print("\n[SUCCESS] Business management migration successful!\n")

def verify_schema():
    """Verify the schema after migration"""
    print("[VERIFY] Verifying business tables...\n")

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    # Check all business tables exist
    business_tables = [
        'plans', 'plan_features', 'subscriptions', 'revenue_metrics',
        'system_metrics', 'call_metrics', 'feature_flags', 'usage_quotas',
        'system_alerts'
    ]

    for table in business_tables:
        assert table in tables, f"{table} table missing!"
        columns = [col['name'] for col in inspector.get_columns(table)]
        print(f"[OK] {table}: {len(columns)} columns")

    print("\n[OK] Schema verification passed!\n")

if __name__ == '__main__':
    try:
        run_migration()
        verify_schema()
        print("[READY] Business management system ready!\n")
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
