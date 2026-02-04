#!/usr/bin/env python3
"""
Database Migration Script
Adds missing columns to existing database schema

Run this script to update the database with new fields:
    python migrate_database.py
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from datetime import datetime

# Get database URL from environment or use PostgreSQL
DATABASE_URL = "postgresql://postgres:jbleFfJMAiljcizINgmQtYOSaUTuuKSK@yamabiko.proxy.rlwy.net:26726/railway"

print(f" Connecting to database...")
engine = create_engine(DATABASE_URL)

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def run_migration():
    """Run all database migrations"""
    print("\n Starting database migration...\n")

    migrations = []

    with engine.connect() as conn:
        # Migration 1: Add call_date to cdr_records
        if not column_exists('cdr_records', 'call_date'):
            print("   Adding call_date column to cdr_records...")
            conn.execute(text("""
                ALTER TABLE cdr_records
                ADD COLUMN call_date TIMESTAMP DEFAULT NOW()
            """))
            conn.execute(text("""
                CREATE INDEX idx_cdr_call_date ON cdr_records(call_date)
            """))
            migrations.append("Added call_date to cdr_records")
            print("      call_date column added with index")
        else:
            print("    call_date already exists in cdr_records")

        # Migration 2: Add max_users to tenants
        if not column_exists('tenants', 'max_users'):
            print("   Adding max_users column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_users INTEGER DEFAULT 5
            """))
            migrations.append("Added max_users to tenants")
            print("      max_users column added")
        else:
            print("    max_users already exists in tenants")

        # Migration 3: Add max_calls_per_month to tenants
        if not column_exists('tenants', 'max_calls_per_month'):
            print("   Adding max_calls_per_month column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_calls_per_month INTEGER DEFAULT 1000
            """))
            migrations.append("Added max_calls_per_month to tenants")
            print("      max_calls_per_month column added")
        else:
            print("    max_calls_per_month already exists in tenants")

        # Migration 4: Add subscription_status to tenants
        if not column_exists('tenants', 'subscription_status'):
            print("   Adding subscription_status column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active'
            """))
            migrations.append("Added subscription_status to tenants")
            print("      subscription_status column added")
        else:
            print("    subscription_status already exists in tenants")

        # Migration 5: Create ai_features table
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if 'ai_features' not in tables:
            print("   Creating ai_features table...")
            conn.execute(text("""
                CREATE TABLE ai_features (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    long_description TEXT,
                    category VARCHAR(50),
                    icon VARCHAR(50),
                    monthly_price FLOAT DEFAULT 0,
                    setup_fee FLOAT DEFAULT 0,
                    price_per_call FLOAT DEFAULT 0,
                    requires_openai BOOLEAN DEFAULT FALSE,
                    openai_model VARCHAR(50),
                    processing_time_estimate INTEGER,
                    benefit_summary TEXT,
                    use_cases TEXT,
                    roi_metrics TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_beta BOOLEAN DEFAULT FALSE,
                    requires_approval BOOLEAN DEFAULT FALSE,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            migrations.append("Created ai_features table")
            print("      ai_features table created")
        else:
            print("    ai_features table already exists")

        # Migration 6: Create tenant_ai_features junction table
        if 'tenant_ai_features' not in tables:
            print("   Creating tenant_ai_features table...")
            conn.execute(text("""
                CREATE TABLE tenant_ai_features (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    ai_feature_id INTEGER NOT NULL REFERENCES ai_features(id) ON DELETE CASCADE,
                    enabled BOOLEAN DEFAULT TRUE,
                    custom_monthly_price FLOAT,
                    custom_setup_fee FLOAT,
                    usage_count INTEGER DEFAULT 0,
                    last_used_at TIMESTAMP,
                    configuration TEXT,
                    enabled_at TIMESTAMP DEFAULT NOW(),
                    disabled_at TIMESTAMP,
                    enabled_by VARCHAR(200),
                    UNIQUE(tenant_id, ai_feature_id)
                )
            """))
            conn.execute(text("""
                CREATE INDEX idx_tenant_ai_features_tenant ON tenant_ai_features(tenant_id)
            """))
            conn.execute(text("""
                CREATE INDEX idx_tenant_ai_features_feature ON tenant_ai_features(ai_feature_id)
            """))
            migrations.append("Created tenant_ai_features table")
            print("      tenant_ai_features table created with indexes")
        else:
            print("    tenant_ai_features table already exists")

        # Migration 7: Create AI result tables
        ai_result_tables = {
            'call_quality_scores': """
                CREATE TABLE call_quality_scores (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    overall_score INTEGER,
                    greeting_score INTEGER,
                    professionalism_score INTEGER,
                    closing_score INTEGER,
                    objection_handling_score INTEGER,
                    empathy_score INTEGER,
                    strengths TEXT,
                    weaknesses TEXT,
                    recommendations TEXT,
                    scored_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'emotion_detections': """
                CREATE TABLE emotion_detections (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    primary_emotion VARCHAR(50),
                    emotion_confidence FLOAT,
                    emotions_detected TEXT,
                    emotional_journey TEXT,
                    detected_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'compliance_alerts': """
                CREATE TABLE compliance_alerts (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL REFERENCES cdr_records(id) ON DELETE CASCADE,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    alert_type VARCHAR(50),
                    severity VARCHAR(20),
                    keyword VARCHAR(200),
                    context TEXT,
                    timestamp_in_call INTEGER,
                    resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TIMESTAMP,
                    resolved_by VARCHAR(200),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'talk_time_metrics': """
                CREATE TABLE talk_time_metrics (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    agent_talk_time INTEGER,
                    customer_talk_time INTEGER,
                    silence_time INTEGER,
                    overlap_time INTEGER,
                    agent_talk_percentage FLOAT,
                    customer_talk_percentage FLOAT,
                    interruptions_by_agent INTEGER,
                    interruptions_by_customer INTEGER,
                    longest_silence INTEGER,
                    average_silence_length FLOAT,
                    analyzed_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'deal_risk_scores': """
                CREATE TABLE deal_risk_scores (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    risk_score FLOAT,
                    risk_level VARCHAR(20),
                    close_probability FLOAT,
                    risk_factors TEXT,
                    positive_signals TEXT,
                    recommendations TEXT,
                    predicted_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'churn_predictions': """
                CREATE TABLE churn_predictions (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    churn_risk_score FLOAT,
                    churn_risk_level VARCHAR(20),
                    predicted_churn_date DATE,
                    churn_indicators TEXT,
                    retention_recommendations TEXT,
                    predicted_at TIMESTAMP DEFAULT NOW()
                )
            """,
            'objection_analyses': """
                CREATE TABLE objection_analyses (
                    id SERIAL PRIMARY KEY,
                    cdr_id INTEGER NOT NULL UNIQUE REFERENCES cdr_records(id) ON DELETE CASCADE,
                    objections_detected TEXT,
                    objection_types TEXT,
                    objections_handled_well INTEGER,
                    objections_handled_poorly INTEGER,
                    handling_effectiveness_score FLOAT,
                    successful_responses TEXT,
                    improvement_areas TEXT,
                    analyzed_at TIMESTAMP DEFAULT NOW()
                )
            """
        }

        for table_name, create_sql in ai_result_tables.items():
            if table_name not in tables:
                print(f"   Creating {table_name} table...")
                conn.execute(text(create_sql))
                migrations.append(f"Created {table_name} table")
                print(f"      {table_name} table created")
            else:
                print(f"    {table_name} table already exists")

        # Commit all changes
        conn.commit()

    print(f"\n Migration complete! {len(migrations)} changes applied:")
    for i, migration in enumerate(migrations, 1):
        print(f"   {i}. {migration}")

    if not migrations:
        print("     No migrations needed - database is up to date")

    print("\n Database migration successful!\n")

def verify_schema():
    """Verify the schema after migration"""
    print(" Verifying schema...\n")

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    # Check cdr_records table
    cdr_columns = [col['name'] for col in inspector.get_columns('cdr_records')]
    print(f" cdr_records columns: {', '.join(cdr_columns)}")
    assert 'call_date' in cdr_columns, "call_date column missing!"

    # Check tenants table
    tenant_columns = [col['name'] for col in inspector.get_columns('tenants')]
    print(f" tenants columns: {', '.join(tenant_columns)}")
    assert 'max_users' in tenant_columns, "max_users column missing!"
    assert 'max_calls_per_month' in tenant_columns, "max_calls_per_month column missing!"
    assert 'subscription_status' in tenant_columns, "subscription_status column missing!"

    # Check ai_features table
    assert 'ai_features' in tables, "ai_features table missing!"
    ai_feature_columns = [col['name'] for col in inspector.get_columns('ai_features')]
    print(f" ai_features table: {len(ai_feature_columns)} columns")
    assert 'slug' in ai_feature_columns, "slug column missing!"
    assert 'monthly_price' in ai_feature_columns, "monthly_price column missing!"

    # Check tenant_ai_features table
    assert 'tenant_ai_features' in tables, "tenant_ai_features table missing!"
    tenant_ai_columns = [col['name'] for col in inspector.get_columns('tenant_ai_features')]
    print(f" tenant_ai_features table: {len(tenant_ai_columns)} columns")
    assert 'tenant_id' in tenant_ai_columns, "tenant_id column missing!"
    assert 'ai_feature_id' in tenant_ai_columns, "ai_feature_id column missing!"

    print("\n Schema verification passed!\n")

if __name__ == '__main__':
    try:
        run_migration()
        verify_schema()
        print(" Ready for production!\n")
    except Exception as e:
        print(f"\n Migration failed: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
