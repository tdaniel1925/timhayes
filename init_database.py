#!/usr/bin/env python3
"""Initialize or reset the database with correct schema"""

from app import app, db
import os

with app.app_context():
    # Check if database exists
    db_path = 'callinsight.db'
    db_exists = os.path.exists(db_path)

    if db_exists:
        print(f"[WARNING] Database {db_path} exists.")
        print("[INFO] Creating all tables (will add missing columns)...")
    else:
        print(f"[INFO] Creating new database: {db_path}")

    # Create all tables
    db.create_all()

    print("[SUCCESS] Database schema initialized!")
    print()
    print("=" * 60)
    print("Next step: Create a demo tenant")
    print("=" * 60)
    print("python create_demo_tenant.py")
    print()
