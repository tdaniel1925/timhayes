#!/usr/bin/env python3
"""Database Schema Report Generator"""

from app import db, app, Tenant, User, CDRRecord, Transcription, SentimentAnalysis
import os

def generate_report():
    with app.app_context():
        # Ensure tables are created
        db.create_all()

        print("=" * 80)
        print("AUDIAPRO DATABASE SCHEMA REPORT")
        print("=" * 80)

        # Database info
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"\nDatabase URI: {db_uri}")

        if db_uri.startswith('sqlite'):
            db_path = db_uri.replace('sqlite:///', '')
            print(f"Database Path: {db_path}")
            print(f"Database Exists: {os.path.exists(db_path)}")
            if os.path.exists(db_path):
                print(f"Database Size: {os.path.getsize(db_path)} bytes")

        print(f"\nTotal Tables: {len(db.metadata.tables)}")
        print(f"Tables: {', '.join(db.metadata.tables.keys())}")

        # Detailed schema for each table
        for table_name in ['tenants', 'users', 'cdr_records', 'transcriptions', 'sentiment_analysis']:
            if table_name not in db.metadata.tables:
                print(f"\n⚠️  WARNING: {table_name} table not found!")
                continue

            table = db.metadata.tables[table_name]
            print(f"\n{'-' * 80}")
            print(f"TABLE: {table_name.upper()}")
            print(f"{'-' * 80}")

            for column in table.columns:
                col_type = str(column.type)
                nullable = "NULL" if column.nullable else "NOT NULL"
                flags = []

                if column.primary_key:
                    flags.append("PRIMARY KEY")
                if column.unique:
                    flags.append("UNIQUE")
                if column.foreign_keys:
                    fk = list(column.foreign_keys)[0]
                    flags.append(f"FK -> {fk.target_fullname}")
                if column.default:
                    if hasattr(column.default, 'arg'):
                        flags.append(f"DEFAULT: {column.default.arg}")
                    else:
                        flags.append("DEFAULT: (function)")

                flags_str = " | ".join(flags) if flags else ""
                print(f"  {column.name:<30} {col_type:<20} {nullable:8}  {flags_str}")

        # Count existing records
        print(f"\n{'-' * 80}")
        print("RECORD COUNTS")
        print(f"{'-' * 80}")

        counts = {
            'Tenants': Tenant.query.count(),
            'Users': User.query.count(),
            'CDR Records (Call Logs)': CDRRecord.query.count(),
            'Transcriptions': Transcription.query.count(),
            'Sentiment Analyses': SentimentAnalysis.query.count()
        }

        for name, count in counts.items():
            print(f"  {name:<30} {count:>10} records")

        # Summary
        print(f"\n{'-' * 80}")
        print("FEATURES STATUS")
        print(f"{'-' * 80}")

        features = {
            '✓ Users & Authentication': 'YES - users table with bcrypt password hashing',
            '✓ Multi-Tenant Support': 'YES - tenants table with subdomain isolation',
            '✓ Call Logs (CDR)': 'YES - cdr_records table with call details',
            '✓ Call Transcriptions': 'YES - transcriptions table linked to CDRs',
            '✓ AI Sentiment Analysis': 'YES - sentiment_analysis table with scores',
            '✗ Email Notifications': 'NO - No dedicated email_notifications table',
            '✗ AI Summaries Storage': 'NO - AI summaries stored in sentiment_analysis.key_phrases only',
            '✗ Notification Settings': 'NO - No notification preferences table',
            '✗ Audit Logs': 'NO - No audit log table'
        }

        for feature, status in features.items():
            symbol = "✓" if status.startswith("YES") else "✗"
            print(f"  {symbol} {feature}")
            print(f"     → {status}")

        print(f"\n{'-' * 80}")
        print("RECOMMENDATIONS")
        print(f"{'-' * 80}")
        print("  1. Add email_notifications table for tracking sent notifications")
        print("  2. Add ai_summaries table for storing detailed AI analysis")
        print("  3. Add notification_settings table for user notification preferences")
        print("  4. Add audit_logs table for tracking system events")
        print("  5. Add api_keys table if planning API access")
        print(f"\n{'-' * 80}\n")

if __name__ == '__main__':
    generate_report()
