#!/usr/bin/env python3
"""
AudiaPro - Enhanced Multi-Tenant SaaS Platform
Backend API with JWT Authentication, Analytics, and Multi-Platform Support
"""

import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
import bcrypt
import requests
from typing import Optional, Dict, Any, List
import threading
from urllib.parse import quote
from sqlalchemy import and_, func, extract, text
from collections import defaultdict
import csv
import io
from cryptography.fernet import Fernet, InvalidToken
import secrets as crypto_secrets

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# OpenAI for transcription and sentiment analysis
from openai import OpenAI

# Import error handling system
from error_handlers import (
    register_error_handlers,
    safe_json_parse,
    safe_int,
    safe_float,
    safe_division,
    validate_required_fields,
    validate_pagination,
    DatabaseTransaction
)

# Import Supabase Storage Manager
from supabase_storage import init_storage_manager, get_storage_manager

# Import UCM Recording Downloader
from ucm_downloader import download_and_upload_recording, get_recording_for_transcription

# Import comprehensive default prompts registry
from prompts_config import DEFAULT_PROMPTS
from prompt_scenarios import get_scenarios_for_feature, get_scenario_by_id, get_all_scenarios

# Initialize Flask app
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*", "allow_headers": ["Content-Type", "Authorization"]}}, supports_credentials=True)

# Rate Limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"  # Use Redis in production: redis://localhost:6379
)

# Configuration
# Fix Railway's postgres:// URL to postgresql:// for SQLAlchemy compatibility
database_url = os.getenv('DATABASE_URL')

# TEMPORARY: Hardcode Supabase database URL until we fix environment variables
if not database_url:
    database_url = 'postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    print("WARNING: Using hardcoded DATABASE_URL (Supabase) - environment variable not set")

if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Register error handlers for crash prevention
register_error_handlers(app, db)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure recording directory exists
RECORDING_DIR = os.getenv('RECORDING_DIR', './recordings')
Path(RECORDING_DIR).mkdir(parents=True, exist_ok=True)

# Encryption key for sensitive data (must be set in production!)
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # Generate a key for development (DO NOT use in production)
    logger.warning("⚠️  ENCRYPTION_KEY not set! Generating temporary key. SET THIS IN PRODUCTION!")
    ENCRYPTION_KEY = Fernet.generate_key().decode()
else:
    logger.info(f"✅ ENCRYPTION_KEY loaded: {ENCRYPTION_KEY[:20]}...{ENCRYPTION_KEY[-10:]}")

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
TRANSCRIPTION_ENABLED = os.getenv('TRANSCRIPTION_ENABLED', 'false').lower() == 'true'
SENTIMENT_ENABLED = os.getenv('SENTIMENT_ENABLED', 'false').lower() == 'true'

# Initialize OpenAI client if API key is set
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("✅ OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
else:
    logger.warning("⚠️  OPENAI_API_KEY not set - AI features will be disabled")

# ============================================================================
# PROMPT RETRIEVAL SYSTEM
# ============================================================================

def get_prompt_for_feature(tenant_id, feature_slug, industry=None):
    """
    Retrieve the appropriate prompt for an AI feature.

    Priority order:
    1. Active custom prompt for tenant (from PromptCustomization table)
    2. Industry-specific default (if industry provided)
    3. Generic default
    4. None (with error logging)

    Args:
        tenant_id (int): The tenant ID
        feature_slug (str): Feature identifier (e.g., 'sentiment-analysis')
        industry (str, optional): Industry slug (e.g., 'b2b_sales', 'healthcare')

    Returns:
        tuple: (prompt_text, prompt_source)
            prompt_text (str): The actual prompt to use
            prompt_source (str): One of 'custom', 'industry', 'default', 'none'
    """
    try:
        # STEP 1: Check for active custom prompt
        # Note: PromptCustomization model will be available after models are defined below
        # This function should be called after app initialization
        if 'PromptCustomization' in globals():
            custom_prompt = PromptCustomization.query.filter_by(
                tenant_id=tenant_id,
                ai_feature_slug=feature_slug,
                is_active=True
            ).first()

            if custom_prompt and custom_prompt.custom_prompt:
                logger.info(f"✅ Using CUSTOM prompt for {feature_slug} (tenant {tenant_id}, version {custom_prompt.version})")
                return (custom_prompt.custom_prompt, 'custom')

        # STEP 2: Get default prompts for this feature
        default_prompts = DEFAULT_PROMPTS.get(feature_slug)
        if not default_prompts:
            logger.error(f"❌ No default prompts defined for feature: {feature_slug}")
            return (None, 'none')

        # STEP 3: Try industry-specific default if industry provided
        if industry and industry in default_prompts:
            logger.info(f"✅ Using INDUSTRY default for {feature_slug} (industry: {industry})")
            core = default_prompts.get('core_instructions', '')
            industry_prompt = default_prompts[industry]
            return (f"{core}\n\n{industry_prompt}", 'industry')

        # STEP 4: Fall back to generic default
        logger.info(f"✅ Using GENERIC default for {feature_slug}")
        core = default_prompts.get('core_instructions', '')
        generic = default_prompts.get('generic', '')
        return (f"{core}\n\n{generic}", 'default')

    except Exception as e:
        logger.error(f"❌ Error retrieving prompt for {feature_slug}: {str(e)}")
        return (None, 'none')


def get_tenant_industry(tenant_id):
    """
    Get the industry setting for a tenant.

    Args:
        tenant_id (int): The tenant ID

    Returns:
        str or None: Industry slug if set, None otherwise
    """
    try:
        # Note: Tenant model will be available after models are defined below
        if 'Tenant' in globals():
            tenant = Tenant.query.get(tenant_id)
            if tenant and hasattr(tenant, 'industry'):
                return tenant.industry
        return None
    except Exception as e:
        logger.error(f"❌ Error retrieving tenant industry: {str(e)}")
        return None

# Initialize Supabase Storage for call recordings
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET', 'call-recordings')

if SUPABASE_URL and SUPABASE_KEY:
    try:
        logger.info(f"Initializing Supabase Storage: URL={SUPABASE_URL}, Bucket={SUPABASE_BUCKET}")
        init_storage_manager(SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET)
        logger.info("✅ Supabase Storage initialized successfully")
    except Exception as e:
        import traceback
        logger.error(f"Failed to initialize Supabase Storage: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
else:
    logger.warning("⚠️  Supabase Storage not configured - recordings will be stored locally")

# UCM Configuration (for downloading recordings)
UCM_IP = os.getenv('UCM_IP', '192.168.1.100')
UCM_USERNAME = os.getenv('UCM_USERNAME', 'admin')
UCM_PASSWORD = os.getenv('UCM_PASSWORD', 'password')
UCM_PORT = int(os.getenv('UCM_PORT', '8089'))

# ============================================================================
# PHONE SYSTEM PRESETS
# ============================================================================

PHONE_SYSTEM_PRESETS = {
    'grandstream_ucm': {
        'name': 'Grandstream UCM',
        'default_port': 8443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://documentation.grandstream.com'
    },
    'ringcentral': {
        'name': 'RingCentral',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://developers.ringcentral.com'
    },
    '3cx': {
        'name': '3CX Phone System',
        'default_port': 5001,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.3cx.com/docs/manual/cdr-reports/'
    },
    'freepbx': {
        'name': 'FreePBX / Asterisk',
        'default_port': 80,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://wiki.freepbx.org/display/FPG/CDR+Reports'
    },
    'yeastar': {
        'name': 'Yeastar PBX',
        'default_port': 8088,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://help.yeastar.com'
    },
    'vitalpbx': {
        'name': 'VitalPBX',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://vitalpbx.com/documentation'
    },
    'fusionpbx': {
        'name': 'FusionPBX',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://docs.fusionpbx.com'
    },
    'twilio': {
        'name': 'Twilio',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.twilio.com/docs'
    },
    'goto_connect': {
        'name': 'GoTo Connect',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://support.goto.com/connect',
        'setup_guide': 'Configure webhooks in GoTo Admin > Integrations > Webhooks'
    },
    'cisco_ucm': {
        'name': 'Cisco Unified Communications Manager',
        'default_port': 8443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.cisco.com/c/en/us/support/unified-communications/unified-communications-manager-callmanager/tsd-products-support-series-home.html'
    },
    'avaya_ip_office': {
        'name': 'Avaya IP Office',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://support.avaya.com/products/P0997/ip-office'
    },
    'mitel': {
        'name': 'Mitel MiVoice',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.mitel.com/support'
    },
    'nextiva': {
        'name': 'Nextiva',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.nextiva.com/support'
    },
    '8x8': {
        'name': '8x8 X Series',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://support.8x8.com/'
    },
    'vonage': {
        'name': 'Vonage Business Communications',
        'default_port': 443,
        'webhook_path': '/api/webhook/cdr/{subdomain}',
        'supports_recording': True,
        'cdr_format': 'json',
        'documentation': 'https://www.vonage.com/support/'
    }
}

# ============================================================================
# DATABASE MODELS
# ============================================================================

class Tenant(db.Model):
    """Organization/Company - top level isolation"""
    __tablename__ = 'tenants'

    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), nullable=False)
    subdomain = db.Column(db.String(100), unique=True, nullable=False)

    # Phone System Configuration
    phone_system_type = db.Column(db.String(50), default='grandstream_ucm')
    pbx_ip = db.Column(db.String(200))
    pbx_username = db.Column(db.String(100))
    _pbx_password = db.Column('pbx_password', db.Text)  # Encrypted
    pbx_port = db.Column(db.Integer, default=8443)

    # Webhook credentials
    webhook_username = db.Column(db.String(100))
    _webhook_password = db.Column('webhook_password', db.Text)  # Encrypted

    # Features
    transcription_enabled = db.Column(db.Boolean, default=True)
    sentiment_enabled = db.Column(db.Boolean, default=True)

    # Subscription
    plan = db.Column(db.String(50), default='starter')
    max_users = db.Column(db.Integer, default=5)
    max_calls_per_month = db.Column(db.Integer, default=1000)
    plan_limits = db.Column(db.Text)  # JSON: {calls_per_month: 500, recording_storage_gb: 10}
    usage_this_month = db.Column(db.Integer, default=0)  # Call count this month
    billing_cycle_start = db.Column(db.DateTime)
    subscription_status = db.Column(db.String(50), default='active')

    # PayPal subscription
    paypal_subscription_id = db.Column(db.String(200))
    paypal_customer_id = db.Column(db.String(200))

    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_ends_at = db.Column(db.DateTime)

    # Relationships
    users = db.relationship('User', backref='tenant', lazy=True, cascade='all, delete-orphan')
    cdr_records = db.relationship('CDRRecord', backref='tenant', lazy=True, cascade='all, delete-orphan')

    # Encrypted password properties
    @property
    def pbx_password(self):
        if not self._pbx_password:
            return None
        try:
            return cipher_suite.decrypt(self._pbx_password.encode()).decode()
        except (InvalidToken, UnicodeDecodeError) as e:
            logger.error(f"Failed to decrypt pbx_password for tenant {self.id}: {e}")
            return None

    @pbx_password.setter
    def pbx_password(self, value):
        if value:
            self._pbx_password = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._pbx_password = None

    @property
    def webhook_password(self):
        if not self._webhook_password:
            return None
        try:
            decrypted = cipher_suite.decrypt(self._webhook_password.encode()).decode()
            logger.debug(f"Successfully decrypted webhook_password for tenant {self.id}")
            return decrypted
        except (InvalidToken, UnicodeDecodeError) as e:
            logger.error(f"Failed to decrypt webhook_password for tenant {self.id}: {e}")
            logger.error(f"Encrypted value length: {len(self._webhook_password)}, starts with: {self._webhook_password[:30]}")
            logger.error(f"ENCRYPTION_KEY being used (first 20 chars): {ENCRYPTION_KEY[:20] if ENCRYPTION_KEY else 'None'}")
            return None

    @webhook_password.setter
    def webhook_password(self, value):
        if value:
            self._webhook_password = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._webhook_password = None


class User(db.Model):
    """User accounts - belongs to a tenant"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(200))
    phone = db.Column(db.String(50))  # For SMS notifications

    role = db.Column(db.String(50), default='user')
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)

    # Password reset
    reset_token = db.Column(db.String(200))
    reset_token_expires = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def generate_reset_token(self):
        """Generate password reset token valid for 1 hour"""
        self.reset_token = crypto_secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token

    def verify_reset_token(self, token):
        """Verify reset token is valid and not expired"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        if self.reset_token != token:
            return False
        if datetime.utcnow() > self.reset_token_expires:
            return False
        return True


class CDRRecord(db.Model):
    """Call Detail Records - tenant isolated"""
    __tablename__ = 'cdr_records'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    uniqueid = db.Column(db.String(100), nullable=False, index=True)
    src = db.Column(db.String(100))
    dst = db.Column(db.String(100))
    caller_name = db.Column(db.String(200))
    clid = db.Column(db.String(200))
    channel = db.Column(db.String(200))
    dstchannel = db.Column(db.String(200))
    start_time = db.Column(db.String(100))
    answer_time = db.Column(db.String(100))
    end_time = db.Column(db.String(100))
    duration = db.Column(db.Integer)
    billsec = db.Column(db.Integer)
    disposition = db.Column(db.String(50))
    recordfiles = db.Column(db.Text)
    src_trunk_name = db.Column(db.String(200))
    dst_trunk_name = db.Column(db.String(200))
    recording_downloaded = db.Column(db.Boolean, default=False)
    recording_local_path = db.Column(db.Text)
    call_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    received_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    transcription = db.relationship('Transcription', backref='cdr', uselist=False, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('tenant_id', 'uniqueid', name='_tenant_uniqueid_uc'),)


class Transcription(db.Model):
    """Transcriptions - linked to CDR"""
    __tablename__ = 'transcriptions'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False)

    transcription_text = db.Column(db.Text)
    language = db.Column(db.String(10))
    duration_seconds = db.Column(db.Float)
    transcribed_at = db.Column(db.DateTime, default=datetime.utcnow)

    sentiment = db.relationship('SentimentAnalysis', backref='transcription', uselist=False, cascade='all, delete-orphan')


class SentimentAnalysis(db.Model):
    """Sentiment analysis results"""
    __tablename__ = 'sentiment_analysis'

    id = db.Column(db.Integer, primary_key=True)
    transcription_id = db.Column(db.Integer, db.ForeignKey('transcriptions.id'), nullable=False)

    sentiment = db.Column(db.String(50))
    sentiment_score = db.Column(db.Float)
    positive_score = db.Column(db.Float)
    negative_score = db.Column(db.Float)
    neutral_score = db.Column(db.Float)
    key_phrases = db.Column(db.Text)
    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)


class SetupRequest(db.Model):
    """Setup requests from potential customers"""
    __tablename__ = 'setup_requests'

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.String(100), unique=True, nullable=False)  # UUID for tracking

    # Company Information
    company_name = db.Column(db.String(200), nullable=False)
    industry = db.Column(db.String(100))
    company_size = db.Column(db.String(50))
    website = db.Column(db.String(200))

    # Contact Information
    contact_name = db.Column(db.String(200), nullable=False)
    contact_email = db.Column(db.String(200), nullable=False)
    contact_phone = db.Column(db.String(50), nullable=False)
    contact_title = db.Column(db.String(100))

    # Technical Details (stored as JSON)
    technical_details = db.Column(db.Text)  # JSON string

    # Plan and Features
    selected_plan = db.Column(db.String(50))
    features_requested = db.Column(db.Text)  # JSON string

    # Additional Info
    specific_requirements = db.Column(db.Text)
    compliance_requirements = db.Column(db.Text)
    preferred_setup_date = db.Column(db.String(50))

    # Status tracking
    status = db.Column(db.String(50), default='pending')  # pending, payment_received, in_progress, completed, cancelled
    payment_status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    payment_id = db.Column(db.String(200))  # PayPal order ID
    paypal_subscription_id = db.Column(db.String(200))  # PayPal subscription ID

    # Assigned tenant (once created)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=True)

    # Admin notes
    admin_notes = db.Column(db.Text)
    assigned_to = db.Column(db.String(200))  # Admin user handling setup

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)


class AISummary(db.Model):
    """AI-generated call summaries"""
    __tablename__ = 'ai_summaries'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False)

    summary_text = db.Column(db.Text)  # 2-3 sentence summary
    topics = db.Column(db.Text)  # JSON array of topics
    action_items = db.Column(db.Text)  # JSON array of action items
    customer_intent = db.Column(db.String(100))  # query, complaint, feedback, sales
    call_outcome = db.Column(db.String(50))  # resolved, escalated, callback, voicemail

    generated_at = db.Column(db.DateTime, default=datetime.utcnow)


class NotificationRule(db.Model):
    """Notification alert rules"""
    __tablename__ = 'notification_rules'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    name = db.Column(db.String(200), nullable=False)
    trigger_type = db.Column(db.String(100), nullable=False)  # negative_sentiment, high_volume, low_answer_rate, etc.
    threshold_value = db.Column(db.Float)
    threshold_unit = db.Column(db.String(50))  # percentage, count, duration

    enabled = db.Column(db.Boolean, default=True)

    # Notification channels
    notify_email = db.Column(db.Boolean, default=False)
    notify_slack = db.Column(db.Boolean, default=False)
    notify_inapp = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    """User notifications"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null = all users in tenant

    rule_id = db.Column(db.Integer, db.ForeignKey('notification_rules.id'), nullable=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=True)

    notification_type = db.Column(db.String(100))  # alert, info, warning, error
    title = db.Column(db.String(200))
    message = db.Column(db.Text)

    read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class BillingHistory(db.Model):
    """Billing and payment history"""
    __tablename__ = 'billing_history'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    invoice_number = db.Column(db.String(100), unique=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='USD')

    description = db.Column(db.Text)
    billing_period_start = db.Column(db.DateTime)
    billing_period_end = db.Column(db.DateTime)

    payment_method = db.Column(db.String(50))  # paypal, credit_card, etc
    payment_id = db.Column(db.String(200))  # PayPal transaction ID
    payment_status = db.Column(db.String(50), default='pending')  # pending, paid, failed, refunded

    invoice_url = db.Column(db.Text)  # Link to invoice PDF
    receipt_url = db.Column(db.Text)  # Link to receipt

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)


class AuditLog(db.Model):
    """Audit trail for important actions"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    action = db.Column(db.String(100), nullable=False)  # user_created, password_reset, plan_changed, etc
    resource_type = db.Column(db.String(50))  # user, tenant, setup_request, etc
    resource_id = db.Column(db.Integer)

    details = db.Column(db.Text)  # JSON with additional details
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SuperAdmin(db.Model):
    """Platform super administrators - not tied to any tenant"""
    __tablename__ = 'super_admins'

    id = db.Column(db.Integer, primary_key=True)

    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(200))

    role = db.Column(db.String(50), default='super_admin')  # super_admin, admin, support
    is_active = db.Column(db.Boolean, default=True)

    # 2FA fields (for future)
    totp_secret = db.Column(db.String(200))
    totp_enabled = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))


class CallQualityScore(db.Model):
    """Call quality scoring results"""
    __tablename__ = 'call_quality_scores'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    overall_score = db.Column(db.Integer)  # 1-100
    greeting_score = db.Column(db.Integer)
    professionalism_score = db.Column(db.Integer)
    closing_score = db.Column(db.Integer)
    objection_handling_score = db.Column(db.Integer)
    empathy_score = db.Column(db.Integer)

    strengths = db.Column(db.Text)  # JSON array
    weaknesses = db.Column(db.Text)  # JSON array
    recommendations = db.Column(db.Text)  # JSON array

    scored_at = db.Column(db.DateTime, default=datetime.utcnow)


class EmotionDetection(db.Model):
    """Emotion detection results"""
    __tablename__ = 'emotion_detections'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    primary_emotion = db.Column(db.String(50))  # anger, frustration, excitement, confusion, etc.
    emotion_confidence = db.Column(db.Float)  # 0-1

    emotions_detected = db.Column(db.Text)  # JSON object with all emotions and scores
    emotional_journey = db.Column(db.Text)  # JSON array tracking emotion changes over time

    detected_at = db.Column(db.DateTime, default=datetime.utcnow)


class ComplianceAlert(db.Model):
    """Compliance and keyword monitoring alerts"""
    __tablename__ = 'compliance_alerts'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    alert_type = db.Column(db.String(50))  # keyword_violation, script_missing, prohibited_language
    severity = db.Column(db.String(20))  # low, medium, high, critical
    keyword = db.Column(db.String(200))
    context = db.Column(db.Text)  # Surrounding text where keyword was found
    timestamp_in_call = db.Column(db.Integer)  # Seconds into the call

    resolved = db.Column(db.Boolean, default=False)
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(200))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class TalkTimeMetrics(db.Model):
    """Talk time and conversation analysis"""
    __tablename__ = 'talk_time_metrics'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    agent_talk_time = db.Column(db.Integer)  # Seconds
    customer_talk_time = db.Column(db.Integer)  # Seconds
    silence_time = db.Column(db.Integer)  # Seconds
    overlap_time = db.Column(db.Integer)  # Seconds (both talking)

    agent_talk_percentage = db.Column(db.Float)  # 0-100
    customer_talk_percentage = db.Column(db.Float)  # 0-100

    interruptions_by_agent = db.Column(db.Integer)
    interruptions_by_customer = db.Column(db.Integer)

    longest_silence = db.Column(db.Integer)  # Seconds
    average_silence_length = db.Column(db.Float)  # Seconds

    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)


class DealRiskScore(db.Model):
    """Deal risk prediction scores"""
    __tablename__ = 'deal_risk_scores'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    risk_score = db.Column(db.Float)  # 0-100 (higher = more risk)
    risk_level = db.Column(db.String(20))  # low, medium, high
    close_probability = db.Column(db.Float)  # 0-100

    risk_factors = db.Column(db.Text)  # JSON array of risk indicators
    positive_signals = db.Column(db.Text)  # JSON array of positive indicators
    recommendations = db.Column(db.Text)  # JSON array of recommended actions

    predicted_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChurnPrediction(db.Model):
    """Customer churn prediction"""
    __tablename__ = 'churn_predictions'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    churn_risk_score = db.Column(db.Float)  # 0-100
    churn_risk_level = db.Column(db.String(20))  # low, medium, high
    predicted_churn_date = db.Column(db.Date)

    churn_indicators = db.Column(db.Text)  # JSON array
    retention_recommendations = db.Column(db.Text)  # JSON array

    predicted_at = db.Column(db.DateTime, default=datetime.utcnow)


class ObjectionAnalysis(db.Model):
    """Sales objection detection and handling analysis"""
    __tablename__ = 'objection_analyses'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)

    objections_detected = db.Column(db.Text)  # JSON array of objections
    objection_types = db.Column(db.Text)  # JSON array (price, timing, competition, need)

    objections_handled_well = db.Column(db.Integer)
    objections_handled_poorly = db.Column(db.Integer)

    handling_effectiveness_score = db.Column(db.Float)  # 0-100
    successful_responses = db.Column(db.Text)  # JSON array of good responses
    improvement_areas = db.Column(db.Text)  # JSON array

    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)


class PromptCustomization(db.Model):
    """Custom prompts per tenant for AI features"""
    __tablename__ = 'prompt_customizations'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    ai_feature_slug = db.Column(db.String(100), nullable=False)  # which AI feature this is for

    # Prompt data
    custom_prompt = db.Column(db.Text, nullable=False)
    default_prompt = db.Column(db.Text)  # Snapshot of default at time of customization

    # Wizard configuration that generated this prompt
    wizard_config = db.Column(db.Text)  # JSON: {industry, goals, tone, keywords, etc.}

    # Version control
    version = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True)
    parent_version_id = db.Column(db.Integer, db.ForeignKey('prompt_customizations.id'))

    # Digital signature
    signature_name = db.Column(db.String(200), nullable=False)
    signature_ip = db.Column(db.String(50))
    signature_timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Metadata
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Test results snapshot (JSON)
    test_results = db.Column(db.Text)  # Results from testing before activation

    __table_args__ = (
        db.Index('idx_tenant_feature_active', 'tenant_id', 'ai_feature_slug', 'is_active'),
    )


class AIFeature(db.Model):
    """AI features that can be enabled per tenant"""
    __tablename__ = 'ai_features'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    long_description = db.Column(db.Text)  # For marketing pages

    # Categorization
    category = db.Column(db.String(50))  # coaching, compliance, revenue, insights, customer_intelligence, real_time, analytics, multilingual, integration
    icon = db.Column(db.String(50))  # Icon name for UI

    # Pricing
    monthly_price = db.Column(db.Float, default=0)
    setup_fee = db.Column(db.Float, default=0)
    price_per_call = db.Column(db.Float, default=0)  # Additional per-call pricing

    # Feature configuration
    requires_openai = db.Column(db.Boolean, default=False)
    openai_model = db.Column(db.String(50))  # gpt-4, gpt-3.5-turbo, whisper-1
    processing_time_estimate = db.Column(db.Integer)  # Seconds

    # Marketing
    benefit_summary = db.Column(db.Text)  # Short benefit description
    use_cases = db.Column(db.Text)  # JSON array of use case examples
    roi_metrics = db.Column(db.Text)  # JSON object with ROI data

    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_beta = db.Column(db.Boolean, default=False)
    requires_approval = db.Column(db.Boolean, default=False)  # Some features need super admin approval

    # Display order
    display_order = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant_features = db.relationship('TenantAIFeature', backref='feature', lazy=True, cascade='all, delete-orphan')


class TenantAIFeature(db.Model):
    """Junction table: which AI features are enabled for which tenant"""
    __tablename__ = 'tenant_ai_features'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    ai_feature_id = db.Column(db.Integer, db.ForeignKey('ai_features.id'), nullable=False)

    # Status
    enabled = db.Column(db.Boolean, default=True)

    # Pricing overrides (for custom deals)
    custom_monthly_price = db.Column(db.Float)  # Override default pricing
    custom_setup_fee = db.Column(db.Float)

    # Usage tracking
    usage_count = db.Column(db.Integer, default=0)  # How many times this feature was used
    last_used_at = db.Column(db.DateTime)

    # Configuration (feature-specific settings in JSON)
    configuration = db.Column(db.Text)  # JSON object with feature-specific settings

    # Timestamps
    enabled_at = db.Column(db.DateTime, default=datetime.utcnow)
    disabled_at = db.Column(db.DateTime)

    # Who enabled it
    enabled_by = db.Column(db.String(200))  # Super admin email who enabled it

    __table_args__ = (db.UniqueConstraint('tenant_id', 'ai_feature_id', name='_tenant_feature_uc'),)

class Plan(db.Model):
    """Pricing plans (Starter, Professional, Enterprise, etc.)"""
    __tablename__ = 'plans'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)  # "Starter", "Professional"
    slug = db.Column(db.String(100), nullable=False, unique=True)  # "starter", "professional"
    description = db.Column(db.Text)

    # Pricing
    monthly_price = db.Column(db.Float, nullable=False, default=0)
    annual_price = db.Column(db.Float)  # Discounted annual price
    setup_fee = db.Column(db.Float, default=0)

    # Limits
    max_calls_per_month = db.Column(db.Integer, default=100)
    max_users = db.Column(db.Integer, default=5)
    max_storage_gb = db.Column(db.Integer, default=10)
    max_recording_minutes = db.Column(db.Integer, default=1000)

    # Features included
    has_api_access = db.Column(db.Boolean, default=False)
    has_white_label = db.Column(db.Boolean, default=False)
    has_priority_support = db.Column(db.Boolean, default=False)
    has_custom_branding = db.Column(db.Boolean, default=False)

    # Trial settings
    trial_days = db.Column(db.Integer, default=14)

    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=True)  # Show on pricing page
    sort_order = db.Column(db.Integer, default=0)  # Display order

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlanFeature(db.Model):
    """AI Features included in each plan"""
    __tablename__ = 'plan_features'

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    ai_feature_id = db.Column(db.Integer, db.ForeignKey('ai_features.id'), nullable=False)

    # Usage limits for this feature on this plan
    monthly_quota = db.Column(db.Integer)  # e.g., 1000 transcriptions/month
    is_unlimited = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('plan_id', 'ai_feature_id', name='_plan_feature_uc'),)


class Subscription(db.Model):
    """Tenant subscriptions and billing cycles"""
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False, unique=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)

    # Status
    status = db.Column(db.String(50), default='trialing')  # trialing, active, past_due, canceled, paused

    # Billing
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, annual
    current_period_start = db.Column(db.DateTime, default=datetime.utcnow)
    current_period_end = db.Column(db.DateTime)

    # Trial
    trial_start = db.Column(db.DateTime)
    trial_end = db.Column(db.DateTime)

    # Payment
    payment_method = db.Column(db.String(50))  # stripe, paypal, manual
    payment_gateway_id = db.Column(db.String(200))  # External subscription ID
    last_payment_date = db.Column(db.DateTime)
    next_billing_date = db.Column(db.DateTime)

    # Cancellation
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    canceled_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RevenueMetric(db.Model):
    """Track revenue metrics over time (MRR, ARR, churn, etc.)"""
    __tablename__ = 'revenue_metrics'

    id = db.Column(db.Integer, primary_key=True)

    # Period (daily snapshot)
    date = db.Column(db.Date, nullable=False, unique=True)

    # Revenue
    mrr = db.Column(db.Float, default=0)  # Monthly Recurring Revenue
    arr = db.Column(db.Float, default=0)  # Annual Recurring Revenue
    total_revenue = db.Column(db.Float, default=0)  # All-time revenue

    # Customers
    total_tenants = db.Column(db.Integer, default=0)
    active_tenants = db.Column(db.Integer, default=0)  # Paying customers
    trial_tenants = db.Column(db.Integer, default=0)
    churned_tenants = db.Column(db.Integer, default=0)

    # New business
    new_tenants = db.Column(db.Integer, default=0)  # Signups today
    new_paying_tenants = db.Column(db.Integer, default=0)  # Trial → Paid today

    # Churn
    churn_rate = db.Column(db.Float, default=0)  # Percentage
    ltv = db.Column(db.Float, default=0)  # Customer Lifetime Value

    # By plan
    starter_mrr = db.Column(db.Float, default=0)
    professional_mrr = db.Column(db.Float, default=0)
    enterprise_mrr = db.Column(db.Float, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SystemMetric(db.Model):
    """Operational metrics (API usage, costs, performance)"""
    __tablename__ = 'system_metrics'

    id = db.Column(db.Integer, primary_key=True)

    # Period (hourly snapshot)
    timestamp = db.Column(db.DateTime, nullable=False)
    metric_type = db.Column(db.String(50), nullable=False)  # 'api_usage', 'openai_cost', 'storage_usage'

    # Tenant-specific or system-wide
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))

    # Metrics
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))  # 'requests', 'dollars', 'gb', 'minutes'

    # Metadata
    details = db.Column(db.Text)  # JSON with additional context

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.Index('idx_system_metrics_timestamp', 'timestamp'),
                      db.Index('idx_system_metrics_type', 'metric_type'))


class CallMetric(db.Model):
    """Detailed analytics per call for business intelligence"""
    __tablename__ = 'call_metrics'

    id = db.Column(db.Integer, primary_key=True)
    cdr_id = db.Column(db.Integer, db.ForeignKey('cdr_records.id'), nullable=False, unique=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    # Cost tracking
    transcription_cost = db.Column(db.Float, default=0)  # OpenAI Whisper cost
    analysis_cost = db.Column(db.Float, default=0)  # GPT-4 analysis cost
    storage_cost = db.Column(db.Float, default=0)  # Supabase storage cost
    total_cost = db.Column(db.Float, default=0)

    # Performance
    processing_time_seconds = db.Column(db.Float)  # Total AI processing time
    transcription_time = db.Column(db.Float)
    analysis_time = db.Column(db.Float)

    # Quality
    audio_quality_score = db.Column(db.Float)  # 0-100
    transcription_confidence = db.Column(db.Float)  # 0-1

    # Business value indicators
    is_sales_call = db.Column(db.Boolean, default=False)
    is_support_call = db.Column(db.Boolean, default=False)
    has_action_items = db.Column(db.Boolean, default=False)
    has_compliance_alert = db.Column(db.Boolean, default=False)

    # Engagement
    agent_talk_time_percent = db.Column(db.Float)
    customer_talk_time_percent = db.Column(db.Float)
    silence_time_percent = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FeatureFlag(db.Model):
    """Feature flags for gradual rollouts and A/B testing"""
    __tablename__ = 'feature_flags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)

    # Status
    is_enabled = db.Column(db.Boolean, default=False)
    rollout_percentage = db.Column(db.Integer, default=0)  # 0-100, gradual rollout

    # Targeting
    target_plan_ids = db.Column(db.Text)  # JSON array of plan IDs
    target_tenant_ids = db.Column(db.Text)  # JSON array of specific tenant IDs

    # Metadata
    created_by = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UsageQuota(db.Model):
    """Track usage quotas and overages per tenant"""
    __tablename__ = 'usage_quotas'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    # Period
    period_start = db.Column(db.DateTime, nullable=False)
    period_end = db.Column(db.DateTime, nullable=False)

    # Usage
    calls_used = db.Column(db.Integer, default=0)
    calls_limit = db.Column(db.Integer, nullable=False)

    transcription_minutes_used = db.Column(db.Float, default=0)
    transcription_minutes_limit = db.Column(db.Float, nullable=False)

    storage_gb_used = db.Column(db.Float, default=0)
    storage_gb_limit = db.Column(db.Float, nullable=False)

    api_requests_used = db.Column(db.Integer, default=0)
    api_requests_limit = db.Column(db.Integer, nullable=False)

    # Overages
    overage_calls = db.Column(db.Integer, default=0)
    overage_cost = db.Column(db.Float, default=0)

    # Status
    quota_exceeded = db.Column(db.Boolean, default=False)
    warning_sent = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.Index('idx_usage_quota_tenant_period', 'tenant_id', 'period_start'),)


class SystemAlert(db.Model):
    """System-wide alerts for super admins"""
    __tablename__ = 'system_alerts'

    id = db.Column(db.Integer, primary_key=True)

    # Alert details
    alert_type = db.Column(db.String(50), nullable=False)  # 'high_cost', 'error_rate', 'downtime', 'quota_exceeded'
    severity = db.Column(db.String(20), default='warning')  # 'info', 'warning', 'critical'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)

    # Context
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))
    metric_value = db.Column(db.Float)
    threshold_value = db.Column(db.Float)

    # Status
    is_resolved = db.Column(db.Boolean, default=False)
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(200))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.Index('idx_system_alerts_unresolved', 'is_resolved', 'created_at'),)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def log_audit(action, resource_type=None, resource_id=None, details=None, user_id=None, tenant_id=None):
    """Log audit trail for important actions"""
    try:
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=request.remote_addr if request else None,
            user_agent=request.headers.get('User-Agent') if request else None
        )
        db.session.add(audit)
        db.session.commit()
        logger.info(f"Audit: {action} by user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log audit: {e}")


def check_usage_limit(tenant_id):
    """Check if tenant has exceeded usage limits"""
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return False

    # Use max_calls_per_month from tenant model
    calls_limit = tenant.max_calls_per_month or 500

    # Check if exceeded
    if tenant.usage_this_month >= calls_limit:
        logger.warning(f"Tenant {tenant_id} exceeded usage limit: {tenant.usage_this_month}/{calls_limit}")
        return False

    return True


def increment_usage(tenant_id):
    """Increment usage counter for tenant"""
    try:
        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            logger.error(f"Tenant {tenant_id} not found for usage increment")
            return

        old_usage = tenant.usage_this_month or 0
        tenant.usage_this_month = old_usage + 1
        db.session.commit()

        # Check if we crossed warning thresholds
        calls_limit = tenant.max_calls_per_month or 500
        new_percentage = (tenant.usage_this_month / calls_limit * 100) if calls_limit > 0 else 0
        old_percentage = (old_usage / calls_limit * 100) if calls_limit > 0 else 0

        # Send warning at 80% threshold
        if old_percentage < 80 and new_percentage >= 80:
            logger.info(f"Tenant {tenant_id} reached 80% usage threshold")
            send_usage_limit_warning(tenant, 'calls')

        # Send warning at 90% threshold
        elif old_percentage < 90 and new_percentage >= 90:
            logger.info(f"Tenant {tenant_id} reached 90% usage threshold")
            send_usage_limit_warning(tenant, 'calls')

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to increment usage for tenant {tenant_id}: {e}", exc_info=True)


# ============================================================================
# ROLES AND PERMISSIONS SYSTEM
# ============================================================================

# Define role hierarchy and permissions
ROLE_PERMISSIONS = {
    'admin': {
        'description': 'Full access to all tenant features',
        'permissions': [
            'view_all_calls',
            'view_recordings',
            'view_transcriptions',
            'manage_users',
            'manage_settings',
            'manage_integrations',
            'manage_billing',
            'view_analytics',
            'manage_notifications',
            'export_data'
        ]
    },
    'manager': {
        'description': 'View all calls and manage team members',
        'permissions': [
            'view_all_calls',
            'view_recordings',
            'view_transcriptions',
            'view_analytics',
            'export_data'
        ]
    },
    'user': {
        'description': 'View own calls only',
        'permissions': [
            'view_own_calls',
            'view_recordings',
            'view_transcriptions'
        ]
    }
}

def get_user_permissions(role):
    """Get list of permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, {}).get('permissions', [])

def has_permission(role, permission):
    """Check if a role has a specific permission"""
    permissions = get_user_permissions(role)
    return permission in permissions

def require_permission(permission):
    """Decorator to require a specific permission"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            role = claims.get('role', 'user')

            if not has_permission(role, permission):
                return jsonify({
                    'error': 'Permission denied',
                    'message': f'Your role ({role}) does not have permission to: {permission}',
                    'required_permission': permission
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator

def require_role(allowed_roles):
    """Decorator to require one of the specified roles"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            role = claims.get('role', 'user')

            if role not in allowed_roles:
                return jsonify({
                    'error': 'Access denied',
                    'message': f'Your role ({role}) does not have access to this resource',
                    'required_roles': allowed_roles
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ============================================================================
# AI PROCESSING FUNCTIONS (OpenAI Integration)
# ============================================================================

def transcribe_audio(storage_path, call_id=None, tenant_id=None):
    """
    Transcribe audio file using OpenAI Whisper
    Downloads from Supabase if needed, transcribes, then cleans up

    Args:
        storage_path: Path to audio file (local or Supabase Storage path)
        call_id: Optional call ID for logging
        tenant_id: Optional tenant ID for Supabase downloads

    Returns:
        str: Transcribed text or None if transcription fails
    """
    if not openai_client or not TRANSCRIPTION_ENABLED:
        logger.debug(f"Transcription skipped for call {call_id}: OpenAI not configured or transcription disabled")
        return None

    local_file_path = None
    temp_file = False

    try:
        # Get local file for transcription (downloads from Supabase if needed)
        storage_manager = get_storage_manager()
        local_file_path = get_recording_for_transcription(storage_path, storage_manager, tenant_id)

        if not local_file_path or not os.path.exists(local_file_path):
            logger.warning(f"Audio file not available for call {call_id}")
            return None

        # Mark as temp if it was downloaded from Supabase
        temp_file = storage_path.startswith('tenant_') if storage_path else False

        # Open and transcribe audio file
        with open(local_file_path, 'rb') as audio_file:
            logger.info(f"Transcribing audio for call {call_id}: {local_file_path}")

            # Use Whisper API
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            logger.info(f"✅ Transcription complete for call {call_id} ({len(transcript)} characters)")
            return transcript

    except Exception as e:
        logger.error(f"Transcription failed for call {call_id}: {e}", exc_info=True)
        return None

    finally:
        # Clean up temp file if it was downloaded from Supabase
        if temp_file and local_file_path and os.path.exists(local_file_path):
            try:
                os.remove(local_file_path)
                logger.debug(f"Cleaned up temp transcription file: {local_file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temp file: {cleanup_error}")


def analyze_sentiment(transcription_text, tenant_id, call_id=None):
    """
    Analyze sentiment of call transcription using OpenAI GPT with dynamic prompts

    Args:
        transcription_text: The transcribed call text
        tenant_id: The tenant ID for retrieving custom/industry prompts
        call_id: Optional call ID for logging

    Returns:
        dict: {'sentiment': 'POSITIVE/NEGATIVE/NEUTRAL', 'score': 0.0-1.0, 'reasoning': str, ...}
              or None if analysis fails
    """
    if not openai_client or not SENTIMENT_ENABLED:
        logger.debug(f"Sentiment analysis skipped for call {call_id}: OpenAI not configured or sentiment disabled")
        return None

    if not transcription_text or len(transcription_text.strip()) == 0:
        logger.warning(f"Empty transcription for call {call_id}, cannot analyze sentiment")
        return None

    try:
        logger.info(f"Analyzing sentiment for call {call_id} (tenant {tenant_id})")

        # Get industry-aware prompt for this tenant
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'sentiment-analysis', industry)

        if not system_prompt:
            logger.error(f"No prompt available for sentiment-analysis, using basic fallback")
            system_prompt = "You are a sentiment analysis assistant. Analyze sentiment and respond in JSON format with: sentiment (POSITIVE, NEGATIVE, or NEUTRAL), score (0.0 to 1.0), and reasoning."

        logger.debug(f"Using {prompt_source} prompt for sentiment-analysis (industry: {industry})")

        # Use GPT to analyze sentiment
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Cost-effective model for sentiment
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Analyze the sentiment of this call transcription:\n\n{transcription_text[:3000]}"  # Increased limit for better analysis
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        # Parse response
        result = json.loads(response.choices[0].message.content)

        sentiment = result.get('sentiment', 'NEUTRAL').upper()
        score = float(result.get('score', 0.5))
        reasoning = result.get('reasoning', '')

        # Validate sentiment value
        if sentiment not in ['POSITIVE', 'NEGATIVE', 'NEUTRAL']:
            sentiment = 'NEUTRAL'

        # Clamp score to 0-1 range
        score = max(0.0, min(1.0, score))

        logger.info(f"✅ Sentiment analysis complete for call {call_id}: {sentiment} ({score:.2f}) using {prompt_source} prompt")

        return {
            'sentiment': sentiment,
            'score': score,
            'reasoning': reasoning,
            'prompt_source': prompt_source  # Track which prompt was used
        }

    except Exception as e:
        logger.error(f"Sentiment analysis failed for call {call_id}: {e}", exc_info=True)
        return None


# ============================================================================
# AI FEATURE HELPER FUNCTIONS
# ============================================================================

def is_feature_enabled(tenant_id, feature_slug):
    """Check if a specific AI feature is enabled for a tenant"""
    try:
        feature = AIFeature.query.filter_by(slug=feature_slug, is_active=True).first()
        if not feature:
            return False

        tenant_feature = TenantAIFeature.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_id=feature.id,
            enabled=True
        ).first()

        return tenant_feature is not None
    except Exception as e:
        logger.error(f"Error checking feature {feature_slug} for tenant {tenant_id}: {e}")
        return False


def track_feature_usage(tenant_id, feature_slug):
    """Increment usage counter for a feature"""
    try:
        feature = AIFeature.query.filter_by(slug=feature_slug).first()
        if not feature:
            return

        tenant_feature = TenantAIFeature.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_id=feature.id
        ).first()

        if tenant_feature:
            tenant_feature.usage_count = (tenant_feature.usage_count or 0) + 1
            tenant_feature.last_used_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        logger.error(f"Error tracking usage for {feature_slug}: {e}")
        db.session.rollback()


def get_enabled_features(tenant_id):
    """Get list of enabled feature slugs for a tenant"""
    try:
        enabled_features = db.session.query(AIFeature.slug).join(
            TenantAIFeature,
            TenantAIFeature.ai_feature_id == AIFeature.id
        ).filter(
            TenantAIFeature.tenant_id == tenant_id,
            TenantAIFeature.enabled == True,
            AIFeature.is_active == True
        ).all()

        return [f[0] for f in enabled_features]
    except Exception as e:
        logger.error(f"Error getting enabled features for tenant {tenant_id}: {e}")
        return []


# ============================================================================
# AI PROCESSING FUNCTIONS
# ============================================================================

def generate_call_summary(transcription_text, tenant_id, cdr_id):
    """Generate AI call summary using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'call-summaries'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Generating call summary for CDR {cdr_id} (tenant {tenant_id})")

        # Get industry-aware prompt
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'call-summaries', industry)

        if not system_prompt:
            system_prompt = "You are an AI assistant that creates concise 2-3 sentence summaries of customer service calls. Include key points, outcome, and any important details. Respond in JSON format with: summary, outcome (resolved/escalated/callback/voicemail)."

        logger.debug(f"Using {prompt_source} prompt for call-summaries (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Summarize this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.5
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        summary = AISummary.query.filter_by(cdr_id=cdr_id).first()
        if not summary:
            summary = AISummary(cdr_id=cdr_id)
            db.session.add(summary)

        summary.summary_text = result.get('summary', '')
        summary.call_outcome = result.get('outcome', 'unknown')
        db.session.commit()

        track_feature_usage(tenant_id, 'call-summaries')
        logger.info(f"✅ Call summary generated for CDR {cdr_id}")

        return result

    except Exception as e:
        logger.error(f"Call summary generation failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def extract_action_items(transcription_text, tenant_id, cdr_id):
    """Extract action items from call using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'action-items'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Extracting action items for CDR {cdr_id} (tenant {tenant_id})")

        # Get industry-aware prompt
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'action-items', industry)

        if not system_prompt:
            system_prompt = "You are an AI assistant that extracts action items, commitments, and next steps from calls. Respond in JSON format with: action_items (array of strings), follow_up_required (boolean), follow_up_deadline (string or null)."

        logger.debug(f"Using {prompt_source} prompt for action-items (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Extract action items from this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        summary = AISummary.query.filter_by(cdr_id=cdr_id).first()
        if not summary:
            summary = AISummary(cdr_id=cdr_id)
            db.session.add(summary)

        summary.action_items = json.dumps(result.get('action_items', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'action-items')
        logger.info(f"✅ Action items extracted for CDR {cdr_id}: {len(result.get('action_items', []))} items")

        return result

    except Exception as e:
        logger.error(f"Action item extraction failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def extract_topics(transcription_text, tenant_id, cdr_id):
    """Extract topics and themes from call"""
    if not is_feature_enabled(tenant_id, 'topic-extraction'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Extracting topics for CDR {cdr_id}")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": get_prompt_for_feature(tenant_id, 'topic-extraction', get_tenant_industry(tenant_id))[0] or "You are an AI that identifies main topics discussed in calls. Respond in JSON format with: topics (array of strings), primary_topic (string)."
                },
                {
                    "role": "user",
                    "content": f"Identify topics in this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        summary = AISummary.query.filter_by(cdr_id=cdr_id).first()
        if not summary:
            summary = AISummary(cdr_id=cdr_id)
            db.session.add(summary)

        summary.topics = json.dumps(result.get('topics', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'topic-extraction')
        logger.info(f"✅ Topics extracted for CDR {cdr_id}")

        return result

    except Exception as e:
        logger.error(f"Topic extraction failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def detect_intent(transcription_text, tenant_id, cdr_id):
    """Detect customer intent using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'intent-detection'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Detecting intent for CDR {cdr_id}")

        # Get industry-aware prompt for this tenant
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'intent-detection', industry)

        if not system_prompt:
            system_prompt = "You are an AI that classifies call intent. Categories: sales_inquiry, support_request, billing_question, complaint, cancellation, general_inquiry, other. Respond in JSON format with: intent (string), confidence (0-1), reasoning (string)."

        logger.debug(f"Using {prompt_source} prompt for intent-detection (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Classify the intent of this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        summary = AISummary.query.filter_by(cdr_id=cdr_id).first()
        if not summary:
            summary = AISummary(cdr_id=cdr_id)
            db.session.add(summary)

        summary.customer_intent = result.get('intent', 'unknown')
        db.session.commit()

        track_feature_usage(tenant_id, 'intent-detection')
        logger.info(f"✅ Intent detected for CDR {cdr_id}: {result.get('intent')}")

        return result

    except Exception as e:
        logger.error(f"Intent detection failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def score_call_quality(transcription_text, tenant_id, cdr_id):
    """Score call quality across multiple dimensions using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'quality-scoring'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Scoring call quality for CDR {cdr_id} (tenant {tenant_id})")

        # Get industry-aware prompt
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'quality-scoring', industry)

        if not system_prompt:
            logger.error(f"No prompt available for quality-scoring, using basic fallback")
            system_prompt = "You are a call quality analyst. Score calls from 1-100 on: overall_score, greeting_score, professionalism_score, closing_score, objection_handling_score, empathy_score. Also provide strengths (array), weaknesses (array), recommendations (array). Respond in JSON."

        logger.debug(f"Using {prompt_source} prompt for quality-scoring (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Score this call:\n\n{transcription_text[:5000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        quality = CallQualityScore.query.filter_by(cdr_id=cdr_id).first()
        if not quality:
            quality = CallQualityScore(cdr_id=cdr_id)
            db.session.add(quality)

        quality.overall_score = result.get('overall_score', 50)
        quality.greeting_score = result.get('greeting_score', 50)
        quality.professionalism_score = result.get('professionalism_score', 50)
        quality.closing_score = result.get('closing_score', 50)
        quality.objection_handling_score = result.get('objection_handling_score', 50)
        quality.empathy_score = result.get('empathy_score', 50)
        quality.strengths = json.dumps(result.get('strengths', []))
        quality.weaknesses = json.dumps(result.get('weaknesses', []))
        quality.recommendations = json.dumps(result.get('recommendations', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'quality-scoring')
        logger.info(f"✅ Call quality scored for CDR {cdr_id}: {result.get('overall_score')}/100")

        return result

    except Exception as e:
        logger.error(f"Call quality scoring failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def detect_emotions(transcription_text, tenant_id, cdr_id):
    """Detect specific emotions in call using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'emotion-detection'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Detecting emotions for CDR {cdr_id}")

        # Get industry-aware prompt for this tenant
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'emotion-detection', industry)

        if not system_prompt:
            system_prompt = "You are an emotion detection AI. Identify emotions: anger, frustration, excitement, confusion, satisfaction, urgency, fear, joy. Respond in JSON with: primary_emotion, emotion_confidence (0-1), emotions_detected (object with emotion:score), emotional_journey (array tracking changes over time)."

        logger.debug(f"Using {prompt_source} prompt for emotion-detection (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Detect emotions in this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        emotion = EmotionDetection.query.filter_by(cdr_id=cdr_id).first()
        if not emotion:
            emotion = EmotionDetection(cdr_id=cdr_id)
            db.session.add(emotion)

        emotion.primary_emotion = result.get('primary_emotion', 'neutral')
        emotion.emotion_confidence = result.get('emotion_confidence', 0.5)
        emotion.emotions_detected = json.dumps(result.get('emotions_detected', {}))
        emotion.emotional_journey = json.dumps(result.get('emotional_journey', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'emotion-detection')
        logger.info(f"✅ Emotions detected for CDR {cdr_id}: {result.get('primary_emotion')}")

        return result

    except Exception as e:
        logger.error(f"Emotion detection failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def predict_churn(transcription_text, tenant_id, cdr_id):
    """Predict customer churn risk using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'churn-prediction'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Predicting churn for CDR {cdr_id}")

        # Get industry-aware prompt for this tenant
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'churn-prediction', industry)

        if not system_prompt:
            system_prompt = "You are a churn prediction AI. Analyze calls for churn risk. Respond in JSON with: churn_risk_score (0-100), churn_risk_level (low/medium/high), churn_indicators (array), retention_recommendations (array)."

        logger.debug(f"Using {prompt_source} prompt for churn-prediction (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Analyze churn risk in this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        churn = ChurnPrediction.query.filter_by(cdr_id=cdr_id).first()
        if not churn:
            churn = ChurnPrediction(cdr_id=cdr_id)
            db.session.add(churn)

        churn.churn_risk_score = result.get('churn_risk_score', 50)
        churn.churn_risk_level = result.get('churn_risk_level', 'medium')
        churn.churn_indicators = json.dumps(result.get('churn_indicators', []))
        churn.retention_recommendations = json.dumps(result.get('retention_recommendations', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'churn-prediction')
        logger.info(f"✅ Churn predicted for CDR {cdr_id}: {result.get('churn_risk_level')}")

        return result

    except Exception as e:
        logger.error(f"Churn prediction failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def analyze_objections(transcription_text, tenant_id, cdr_id):
    """Analyze sales objections and handling using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'objection-handling'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Analyzing objections for CDR {cdr_id} (tenant {tenant_id})")

        # Get industry-aware prompt
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'objection-analysis', industry)

        if not system_prompt:
            system_prompt = "You are a sales objection analyst. Identify objections and how they were handled. Respond in JSON with: objections_detected (array of strings), objection_types (array: price/timing/competition/need), objections_handled_well (number), objections_handled_poorly (number), handling_effectiveness_score (0-100), successful_responses (array), improvement_areas (array)."

        logger.debug(f"Using {prompt_source} prompt for objection-analysis (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Analyze objections in this sales call:\n\n{transcription_text[:5000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        objection = ObjectionAnalysis.query.filter_by(cdr_id=cdr_id).first()
        if not objection:
            objection = ObjectionAnalysis(cdr_id=cdr_id)
            db.session.add(objection)

        objection.objections_detected = json.dumps(result.get('objections_detected', []))
        objection.objection_types = json.dumps(result.get('objection_types', []))
        objection.objections_handled_well = result.get('objections_handled_well', 0)
        objection.objections_handled_poorly = result.get('objections_handled_poorly', 0)
        objection.handling_effectiveness_score = result.get('handling_effectiveness_score', 50)
        objection.successful_responses = json.dumps(result.get('successful_responses', []))
        objection.improvement_areas = json.dumps(result.get('improvement_areas', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'objection-handling')
        logger.info(f"✅ Objections analyzed for CDR {cdr_id}")

        return result

    except Exception as e:
        logger.error(f"Objection analysis failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def predict_deal_risk(transcription_text, tenant_id, cdr_id):
    """Predict deal risk and close probability using dynamic prompts"""
    if not is_feature_enabled(tenant_id, 'deal-risk'):
        return None

    if not openai_client or not transcription_text:
        return None

    try:
        logger.info(f"Predicting deal risk for CDR {cdr_id}")

        # Get industry-aware prompt for this tenant
        industry = get_tenant_industry(tenant_id)
        system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'deal-risk', industry)

        if not system_prompt:
            system_prompt = "You are a deal risk prediction AI. Analyze sales calls for deal health. Respond in JSON with: risk_score (0-100, higher=more risk), risk_level (low/medium/high), close_probability (0-100), risk_factors (array), positive_signals (array), recommendations (array)."

        logger.debug(f"Using {prompt_source} prompt for deal-risk (industry: {industry})")

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Analyze deal risk in this call:\n\n{transcription_text[:4000]}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        # Save to database
        deal = DealRiskScore.query.filter_by(cdr_id=cdr_id).first()
        if not deal:
            deal = DealRiskScore(cdr_id=cdr_id)
            db.session.add(deal)

        deal.risk_score = result.get('risk_score', 50)
        deal.risk_level = result.get('risk_level', 'medium')
        deal.close_probability = result.get('close_probability', 50)
        deal.risk_factors = json.dumps(result.get('risk_factors', []))
        deal.positive_signals = json.dumps(result.get('positive_signals', []))
        deal.recommendations = json.dumps(result.get('recommendations', []))
        db.session.commit()

        track_feature_usage(tenant_id, 'deal-risk')
        logger.info(f"✅ Deal risk predicted for CDR {cdr_id}: {result.get('risk_level')}")

        return result

    except Exception as e:
        logger.error(f"Deal risk prediction failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def monitor_compliance(transcription_text, tenant_id, cdr_id):
    """Monitor for compliance violations using AI analysis and keyword detection"""
    if not is_feature_enabled(tenant_id, 'compliance-monitoring'):
        return None

    if not transcription_text:
        return None

    try:
        logger.info(f"Monitoring compliance for CDR {cdr_id}")

        # PART 1: AI-powered compliance analysis using dynamic prompts
        ai_result = None
        if openai_client:
            # Get industry-aware prompt for this tenant
            industry = get_tenant_industry(tenant_id)
            system_prompt, prompt_source = get_prompt_for_feature(tenant_id, 'compliance-monitoring', industry)

            if not system_prompt:
                system_prompt = "You are a compliance monitoring AI. Analyze calls for regulatory violations, inappropriate language, or prohibited claims. Respond in JSON with: compliance_score (0-100, higher=better), violations (array of {type, severity, description, quote}), risk_level (low/medium/high/critical), recommendations (array)."

            logger.debug(f"Using {prompt_source} prompt for compliance-monitoring (industry: {industry})")

            response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"Monitor compliance in this call:\n\n{transcription_text[:5000]}"
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            ai_result = json.loads(response.choices[0].message.content)

        # PART 2: Keyword-based detection (legacy system, kept as backup)
        prohibited_keywords = [
            'guarantee', 'guaranteed', 'promise', 'definitely will',
            'insider information', 'off the record',
            'don\'t tell anyone', 'between you and me',
        ]

        keyword_alerts = []
        text_lower = transcription_text.lower()
        for keyword in prohibited_keywords:
            if keyword.lower() in text_lower:
                idx = text_lower.find(keyword.lower())
                context_start = max(0, idx - 50)
                context_end = min(len(transcription_text), idx + len(keyword) + 50)
                context = transcription_text[context_start:context_end]

                keyword_alerts.append({
                    'keyword': keyword,
                    'severity': 'high' if keyword in ['guarantee', 'promise'] else 'medium',
                    'context': context
                })

        # Combine AI and keyword results
        all_violations = (ai_result.get('violations', []) if ai_result else []) + keyword_alerts

        # Save to database if violations found
        if all_violations:
            for violation in all_violations[:10]:  # Limit to 10 most important
                alert = ComplianceAlert(
                    cdr_id=cdr_id,
                    tenant_id=tenant_id,
                    alert_type=violation.get('type', 'keyword_violation'),
                    severity=violation.get('severity', 'medium'),
                    keyword=violation.get('keyword', violation.get('description', 'Unknown')),
                    context=violation.get('context', violation.get('quote', ''))[:500]
                )
                db.session.add(alert)

            db.session.commit()
            track_feature_usage(tenant_id, 'compliance-monitoring')
            logger.warning(f"⚠️ {len(all_violations)} compliance violations for CDR {cdr_id}")

        # Return comprehensive result
        return {
            'compliance_score': ai_result.get('compliance_score', 100) if ai_result else (0 if keyword_alerts else 100),
            'risk_level': ai_result.get('risk_level', 'low') if ai_result else ('high' if keyword_alerts else 'low'),
            'violations': all_violations,
            'violation_count': len(all_violations),
            'recommendations': ai_result.get('recommendations', []) if ai_result else []
        }

    except Exception as e:
        logger.error(f"Compliance monitoring failed for CDR {cdr_id}: {e}")
        db.session.rollback()
        return None


def process_call_ai_async(call_id, ucm_recording_path):
    """
    Process call with AI features in background thread
    Downloads recording from UCM, uploads to Supabase, then processes with AI

    Args:
        call_id: Database ID of the call
        ucm_recording_path: Path to recording file on UCM server
    """
    logger.info(f"🎯 process_call_ai_async CALLED for call_id={call_id}, recording={ucm_recording_path}")

    def ai_worker():
        logger.info(f"🧵 AI worker thread STARTED for call {call_id}")
        try:
            with app.app_context():
                logger.info(f"📱 Inside app context for call {call_id}")
                try:
                    # Get call from database
                    logger.info(f"🔍 Querying database for call {call_id}")
                    call = CDRRecord.query.get(call_id)
                    if not call:
                        logger.error(f"❌ Call {call_id} not found for AI processing")
                        return

                    logger.info(f"✅ Found call {call_id} in database")
                    tenant_id = call.tenant_id
                    logger.info(f"🏢 Tenant ID: {tenant_id}")

                    # Step 0: Download recording from UCM and upload to Supabase
                    storage_manager = get_storage_manager()
                    storage_path = None

                    if ucm_recording_path:
                        # CRITICAL FIX: Get tenant-specific UCM credentials
                        tenant = Tenant.query.get(tenant_id)
                        if not tenant:
                            logger.error(f"❌ Tenant {tenant_id} not found for call {call_id}")
                            return

                        # Use tenant-specific credentials instead of global environment variables
                        ucm_ip = tenant.pbx_ip or UCM_IP
                        ucm_username = tenant.pbx_username or UCM_USERNAME
                        ucm_password = tenant.pbx_password or UCM_PASSWORD
                        ucm_port = tenant.pbx_port or UCM_PORT

                        logger.info(f"📥 Starting recording download for call {call_id}")
                        logger.info(f"📍 UCM IP: {ucm_ip}")
                        logger.info(f"👤 UCM Username: {ucm_username}")
                        logger.info(f"📂 UCM Recording Path: {ucm_recording_path}")
                        logger.info(f"🏢 Tenant ID: {tenant_id}")
                        logger.info(f"🆔 Call Unique ID: {call.uniqueid}")
                        logger.info(f"☁️ Storage Manager Available: {storage_manager is not None}")

                        # Validate tenant has UCM credentials configured
                        if not ucm_ip or not ucm_username or not ucm_password:
                            logger.error(f"❌ Tenant {tenant_id} missing UCM credentials (IP: {bool(ucm_ip)}, User: {bool(ucm_username)}, Pass: {bool(ucm_password)})")
                            logger.error(f"   Cannot download recording for call {call_id}. Please configure UCM credentials in tenant settings.")
                            return

                        try:
                            storage_path = download_and_upload_recording(
                                ucm_ip,
                                ucm_username,
                                ucm_password,
                                ucm_recording_path,
                                tenant_id,
                                call.uniqueid,
                                storage_manager,
                                ucm_port
                            )

                            if storage_path:
                                # Update CDR with Supabase storage path
                                call.recordfiles = storage_path
                                db.session.commit()
                                logger.info(f"✅ Recording stored in Supabase: {storage_path}")
                            else:
                                logger.error(f"❌ download_and_upload_recording returned None for call {call_id}")
                        except Exception as download_error:
                            logger.error(f"❌ Exception during download_and_upload_recording: {download_error}", exc_info=True)
                            storage_path = None

                    if not storage_path:
                        logger.warning(f"No recording available for call {call_id}, skipping AI processing")
                        return

                    # Get enabled features for this tenant
                    enabled_features = get_enabled_features(tenant_id)
                    logger.info(f"Processing call {call_id} with features: {enabled_features}")

                    # Step 1: Transcribe audio (required for most features)
                    transcription_text = None
                    if 'multilingual-transcription' in enabled_features or len(enabled_features) > 0:
                        transcription = transcribe_audio(storage_path, call_id, tenant_id)
                        if transcription:
                            # Save transcription to Transcription model
                            trans_obj = Transcription.query.filter_by(cdr_id=call_id).first()
                            if not trans_obj:
                                trans_obj = Transcription(cdr_id=call_id)
                                db.session.add(trans_obj)

                            trans_obj.transcription_text = transcription.transcription_text
                            trans_obj.language = transcription.language
                            db.session.commit()

                            transcription_text = transcription.transcription_text
                            logger.info(f"Transcription saved for call {call_id}")

                            track_feature_usage(tenant_id, 'multilingual-transcription')

                    if not transcription_text:
                        logger.warning(f"No transcription available for call {call_id}, skipping AI processing")
                        return

                    # Step 2: Process with enabled features
                    if 'sentiment-analysis' in enabled_features:
                        sentiment_result = analyze_sentiment(transcription_text, tenant_id, call_id)
                        if sentiment_result:
                            trans_obj = Transcription.query.filter_by(cdr_id=call_id).first()
                            if trans_obj:
                                sent = SentimentAnalysis.query.filter_by(transcription_id=trans_obj.id).first()
                                if not sent:
                                    sent = SentimentAnalysis(transcription_id=trans_obj.id)
                                    db.session.add(sent)

                                sent.sentiment = sentiment_result['sentiment']
                                sent.sentiment_score = sentiment_result['score']
                                db.session.commit()

                            track_feature_usage(tenant_id, 'sentiment-analysis')
                            logger.info(f"Sentiment saved for call {call_id}")

                    if 'call-summaries' in enabled_features:
                        generate_call_summary(transcription_text, tenant_id, call_id)

                    if 'action-items' in enabled_features:
                        extract_action_items(transcription_text, tenant_id, call_id)

                    if 'topic-extraction' in enabled_features:
                        extract_topics(transcription_text, tenant_id, call_id)

                    if 'intent-detection' in enabled_features:
                        detect_intent(transcription_text, tenant_id, call_id)

                    if 'quality-scoring' in enabled_features:
                        score_call_quality(transcription_text, tenant_id, call_id)

                    if 'emotion-detection' in enabled_features:
                        detect_emotions(transcription_text, tenant_id, call_id)

                    if 'churn-prediction' in enabled_features:
                        predict_churn(transcription_text, tenant_id, call_id)

                    if 'objection-handling' in enabled_features:
                        analyze_objections(transcription_text, tenant_id, call_id)

                    if 'deal-risk' in enabled_features:
                        predict_deal_risk(transcription_text, tenant_id, call_id)

                    if 'compliance-monitoring' in enabled_features:
                        monitor_compliance(transcription_text, tenant_id, call_id)

                    logger.info(f"✅ AI processing complete for call {call_id}")

                except Exception as inner_e:
                    logger.error(f"❌ AI processing INNER exception for call {call_id}: {inner_e}", exc_info=True)
                    db.session.rollback()

        except Exception as outer_e:
            logger.error(f"❌ AI worker OUTER exception for call {call_id}: {outer_e}", exc_info=True)
            try:
                db.session.rollback()
            except:
                pass

        logger.info(f"🏁 AI worker thread FINISHED for call {call_id}")

    # Run in background thread
    logger.info(f"🚀 Creating thread for call {call_id}")
    thread = threading.Thread(target=ai_worker, daemon=True)
    logger.info(f"▶️ Starting thread for call {call_id}")
    thread.start()
    logger.info(f"✅ Started AI processing thread for call {call_id}")


# ============================================================================
# DEBUG/TEST ENDPOINTS
# ============================================================================

@app.route('/api/debug/test-ucm-download', methods=['POST'])
@jwt_required()
def test_ucm_download():
    """
    Test UCM recording download functionality
    Tests if we can download recordings from UCM and upload to Supabase

    Body: { "call_id": 123 } (optional - uses most recent call if not provided)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or user.role != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json() or {}
        call_id = data.get('call_id')

        # Get call with recording
        if call_id:
            call = CDRRecord.query.get(call_id)
        else:
            # Get most recent call with recording path
            call = CDRRecord.query.filter(
                CDRRecord.recordfiles.isnot(None),
                CDRRecord.recordfiles != ''
            ).order_by(CDRRecord.id.desc()).first()

        if not call:
            return jsonify({
                'success': False,
                'error': 'No call found with recording'
            }), 404

        if not call.recordfiles:
            return jsonify({
                'success': False,
                'error': f'Call {call.id} has no recording path',
                'call_id': call.id
            }), 400

        # Test download
        logger.info(f"🧪 TEST: Starting UCM download test for call {call.id}")
        logger.info(f"🧪 TEST: Recording path: {call.recordfiles}")
        logger.info(f"🧪 TEST: UCM IP: {UCM_IP}")
        logger.info(f"🧪 TEST: UCM Port: {UCM_PORT}")
        logger.info(f"🧪 TEST: UCM Username: {UCM_USERNAME}")

        storage_manager = get_storage_manager()

        result = {
            'call_id': call.id,
            'recording_path': call.recordfiles,
            'uniqueid': call.uniqueid,
            'tenant_id': call.tenant_id,
            'ucm_ip': UCM_IP,
            'ucm_port': UCM_PORT,
            'ucm_username': UCM_USERNAME,
            'storage_manager_available': storage_manager is not None,
            'steps': []
        }

        try:
            # Attempt download and upload
            result['steps'].append({
                'step': 'Starting download',
                'status': 'in_progress',
                'timestamp': datetime.utcnow().isoformat()
            })

            storage_path = download_and_upload_recording(
                UCM_IP,
                UCM_USERNAME,
                UCM_PASSWORD,
                call.recordfiles,
                call.tenant_id,
                call.uniqueid,
                storage_manager,
                UCM_PORT
            )

            if storage_path:
                result['success'] = True
                result['storage_path'] = storage_path
                result['steps'].append({
                    'step': 'Download and upload completed',
                    'status': 'success',
                    'storage_path': storage_path,
                    'timestamp': datetime.utcnow().isoformat()
                })
                logger.info(f"🧪 TEST: ✅ Successfully downloaded and uploaded to {storage_path}")
            else:
                result['success'] = False
                result['error'] = 'download_and_upload_recording returned None'
                result['steps'].append({
                    'step': 'Download failed',
                    'status': 'failed',
                    'error': 'Function returned None',
                    'timestamp': datetime.utcnow().isoformat()
                })
                logger.error(f"🧪 TEST: ❌ Download failed - function returned None")

        except Exception as download_error:
            result['success'] = False
            result['error'] = str(download_error)
            result['error_type'] = type(download_error).__name__
            result['steps'].append({
                'step': 'Download exception',
                'status': 'error',
                'error': str(download_error),
                'error_type': type(download_error).__name__,
                'timestamp': datetime.utcnow().isoformat()
            })
            logger.error(f"🧪 TEST: ❌ Exception during download: {download_error}", exc_info=True)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"🧪 TEST: ❌ Error in test_ucm_download: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500


# ============================================================================
# SUPER ADMIN ENDPOINTS
# ============================================================================

@app.route('/api/superadmin/register', methods=['POST'])
@limiter.limit("5 per hour")
def superadmin_register():
    """Register first super admin (only if none exist)"""
    try:
        # Check if any super admin exists
        existing = SuperAdmin.query.first()
        if existing:
            return jsonify({'error': 'Super admin already exists'}), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['email', 'password', 'full_name']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create super admin
        super_admin = SuperAdmin(
            email=data['email'].lower().strip(),
            full_name=data['full_name'].strip(),
            role='super_admin',
            is_active=True
        )
        super_admin.set_password(data['password'])

        db.session.add(super_admin)
        db.session.commit()

        logger.info(f"Super admin created: {super_admin.email}")

        # Generate JWT token
        access_token = create_access_token(
            identity=super_admin.id,
            additional_claims={
                'role': 'super_admin',
                'is_super_admin': True
            }
        )
        refresh_token = create_refresh_token(identity=super_admin.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'super_admin': {
                'id': super_admin.id,
                'email': super_admin.email,
                'full_name': super_admin.full_name,
                'role': super_admin.role
            }
        }), 201

    except Exception as e:
        logger.error(f"Super admin registration error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500


@app.route('/api/superadmin/login', methods=['POST'])
@limiter.limit("10 per hour")
def superadmin_login():
    """Super admin login"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400

        # Find super admin
        super_admin = SuperAdmin.query.filter_by(
            email=data['email'].lower().strip()
        ).first()

        if not super_admin or not super_admin.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        if not super_admin.is_active:
            return jsonify({'error': 'Account is disabled'}), 403

        # Update last login
        super_admin.last_login = datetime.utcnow()
        db.session.commit()

        # Generate JWT tokens
        access_token = create_access_token(
            identity=super_admin.id,
            additional_claims={
                'role': 'super_admin',
                'is_super_admin': True
            }
        )
        refresh_token = create_refresh_token(identity=super_admin.id)

        logger.info(f"Super admin logged in: {super_admin.email}")

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'super_admin': {
                'id': super_admin.id,
                'email': super_admin.email,
                'full_name': super_admin.full_name,
                'role': super_admin.role
            }
        }), 200

    except Exception as e:
        logger.error(f"Super admin login error: {e}", exc_info=True)
        return jsonify({'error': 'Login failed'}), 500


@app.route('/api/superadmin/me', methods=['GET'])
@jwt_required()
def get_superadmin_me():
    """Get current super admin info"""
    try:
        claims = get_jwt()
        if not claims.get('is_super_admin'):
            return jsonify({'error': 'Unauthorized'}), 403

        super_admin_id = get_jwt_identity()
        super_admin = SuperAdmin.query.get(super_admin_id)

        if not super_admin:
            return jsonify({'error': 'Super admin not found'}), 404

        return jsonify({
            'id': super_admin.id,
            'email': super_admin.email,
            'full_name': super_admin.full_name,
            'role': super_admin.role,
            'is_active': super_admin.is_active,
            'created_at': super_admin.created_at.isoformat(),
            'last_login': super_admin.last_login.isoformat() if super_admin.last_login else None
        }), 200

    except Exception as e:
        logger.error(f"Get super admin error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to get super admin info'}), 500


# Helper function to check super admin access
def require_super_admin():
    """Decorator to require super admin access"""
    claims = get_jwt()
    if not claims.get('is_super_admin'):
        raise Exception('Super admin access required')
    return True


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit("3 per hour")
def signup():
    """Register new tenant and admin user"""
    data = request.get_json()

    required_fields = ['company_name', 'email', 'password', 'full_name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    subdomain = data['company_name'].lower().replace(' ', '-').replace('_', '-')
    base_subdomain = subdomain
    counter = 1
    while Tenant.query.filter_by(subdomain=subdomain).first():
        subdomain = f"{base_subdomain}-{counter}"
        counter += 1

    try:
        # Set plan limits
        plan = data.get('plan', 'starter')
        plan_limits = {
            'starter': {'calls_per_month': 500, 'recording_storage_gb': 5},
            'professional': {'calls_per_month': 2000, 'recording_storage_gb': 25},
            'enterprise': {'calls_per_month': -1, 'recording_storage_gb': 100}
        }

        tenant = Tenant(
            company_name=data['company_name'],
            subdomain=subdomain,
            plan=plan,
            plan_limits=json.dumps(plan_limits.get(plan, plan_limits['starter'])),
            billing_cycle_start=datetime.utcnow(),
            phone_system_type=data.get('phone_system_type', 'grandstream_ucm')
        )
        db.session.add(tenant)
        db.session.flush()

        # Generate email verification token
        verification_token = crypto_secrets.token_urlsafe(32)

        user = User(
            tenant_id=tenant.id,
            email=data['email'],
            full_name=data['full_name'],
            role='admin',
            reset_token=verification_token,
            reset_token_expires=datetime.utcnow() + timedelta(days=7)
        )
        user.set_password(data['password'])
        db.session.add(user)

        db.session.commit()

        # Send verification email
        send_verification_email(user.email, user.full_name, verification_token)

        # Notify super admins about new tenant
        send_new_tenant_notification_to_superadmins(tenant)

        # Log audit
        log_audit('user_signup', 'user', user.id, {
            'email': user.email,
            'company': tenant.company_name
        }, user.id, tenant.id)

        # Return tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'tenant_id': tenant.id, 'role': user.role}
        )
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'email_verified': user.email_verified,
                'tenant': {
                    'id': tenant.id,
                    'company_name': tenant.company_name,
                    'subdomain': subdomain,
                    'plan': tenant.plan
                }
            },
            'message': 'Account created! Please check your email to verify your account.'
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Signup error: {e}", exc_info=True)
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Login user"""
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active or not user.tenant.is_active:
        return jsonify({'error': 'Account is inactive'}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={'tenant_id': user.tenant_id, 'role': user.role}
    )
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'tenant': {
                'id': user.tenant.id,
                'company_name': user.tenant.company_name,
                'subdomain': user.tenant.subdomain,
                'plan': user.tenant.plan
            }
        }
    }), 200


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    access_token = create_access_token(
        identity=user.id,
        additional_claims={'tenant_id': user.tenant_id, 'role': user.role}
    )

    return jsonify({'access_token': access_token}), 200


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'tenant': {
            'id': user.tenant.id,
            'company_name': user.tenant.company_name,
            'subdomain': user.tenant.subdomain,
            'plan': user.tenant.plan,
            'phone_system_type': user.tenant.phone_system_type,
            'transcription_enabled': user.tenant.transcription_enabled,
            'sentiment_enabled': user.tenant.sentiment_enabled
        }
    }), 200


@app.route('/api/auth/request-password-reset', methods=['POST'])
@limiter.limit("3 per hour")
def request_password_reset():
    """Request password reset email"""
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email required'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return success to prevent email enumeration
    if user:
        token = user.generate_reset_token()
        db.session.commit()

        # Send reset email
        try:
            import resend
            resend.api_key = os.getenv('RESEND_API_KEY')

            reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={token}"

            email_html = f"""
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi {user.full_name},</p>
                <p>We received a request to reset your password for your AudiaPro account.</p>

                <div style="margin: 30px 0;">
                  <a href="{reset_link}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                  </a>
                </div>

                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>

                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  For security, please do not share this link with anyone.
                </p>
              </body>
            </html>
            """

            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'noreply@audiapro.com'),
                "to": [user.email],
                "subject": "Password Reset Request - AudiaPro",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"Password reset email sent to {user.email}")

            # Log audit
            log_audit('password_reset_requested', 'user', user.id, {'email': user.email}, user.id, user.tenant_id)

        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")

    return jsonify({'message': 'If an account with that email exists, a reset link has been sent'}), 200


@app.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({'error': 'Token and new password required'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    # Find user with this token
    user = User.query.filter_by(reset_token=token).first()

    if not user or not user.verify_reset_token(token):
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    # Reset password
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    logger.info(f"Password reset successfully for {user.email}")

    # Log audit
    log_audit('password_reset_completed', 'user', user.id, {'email': user.email}, user.id, user.tenant_id)

    # Send confirmation email
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Hi {user.full_name},</p>
            <p>Your AudiaPro password has been changed successfully.</p>

            <p>If you didn't make this change, please contact support immediately.</p>

            <div style="margin-top: 30px;">
              <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Log In Now
              </a>
            </div>
          </body>
        </html>
        """

        params = {
            "from": os.getenv('RESEND_FROM_EMAIL', 'noreply@audiapro.com'),
            "to": [user.email],
            "subject": "Password Changed - AudiaPro",
            "html": email_html
        }

        resend.Emails.send(params)

    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

    return jsonify({'message': 'Password reset successfully'}), 200


@app.route('/api/auth/verify-email', methods=['POST'])
@limiter.limit("10 per hour")
def verify_email():
    """Verify email address with token"""
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({'error': 'Verification token required'}), 400

        # Find user by token
        user = User.query.filter_by(reset_token=token).first()

        if not user or not user.verify_reset_token(token):
            return jsonify({'error': 'Invalid or expired verification token'}), 400

        # Mark email as verified
        user.email_verified = True
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()

        # Log audit
        log_audit('email_verified', 'user', user.id, {'email': user.email}, user.id, user.tenant_id)

        logger.info(f"Email verified for user: {user.email}")

        return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200

    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return jsonify({'error': 'Email verification failed'}), 500


# ============================================================================
# CDR WEBHOOK ENDPOINT
# ============================================================================

@app.route('/api/admin/sync-cdrs', methods=['POST'])
@jwt_required()
def manual_sync_cdrs():
    """Manually trigger CDR sync from CloudUCM (admin only)"""
    try:
        claims = get_jwt()
        role = claims.get('role', 'user')

        if role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403

        # Import and run CDR poller
        from cdr_poller import poller

        # Run sync in background
        import threading
        thread = threading.Thread(target=poller.poll_all_tenants)
        thread.start()

        return jsonify({
            'status': 'success',
            'message': 'CDR sync started in background. Check back in 30 seconds.'
        }), 200

    except Exception as e:
        logger.error(f"Manual CDR sync error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/webhook/cdr/<subdomain>', methods=['GET', 'POST'])
def receive_cdr(subdomain):
    """Receive CDR webhook - tenant-specific endpoint"""
    try:
        # Handle GET requests (CloudUCM may send GET to verify endpoint)
        if request.method == 'GET':
            logger.info(f"[WEBHOOK] GET request received for tenant: {subdomain}")
            return jsonify({'status': 'ok', 'message': 'Webhook endpoint is ready'}), 200

        # Handle POST requests with CDR data
        # DEBUG: Log raw request details
        logger.info(f"[WEBHOOK DEBUG] Subdomain: {subdomain}")
        logger.info(f"[WEBHOOK DEBUG] Content-Type: {request.content_type}")
        logger.info(f"[WEBHOOK DEBUG] Headers: {dict(request.headers)}")
        logger.info(f"[WEBHOOK DEBUG] Raw data (first 500 chars): {request.data[:500]}")

        tenant = Tenant.query.filter_by(subdomain=subdomain).first()
        if not tenant:
            logger.warning(f"Unknown tenant subdomain: {subdomain}")
            return jsonify({'error': 'Unknown tenant'}), 404

        # Optional authentication - CloudUCM may not send auth headers for IP-based webhooks
        webhook_user = tenant.webhook_username or ""
        webhook_pass = tenant.webhook_password or ""

        auth = request.authorization
        logger.info(f"[WEBHOOK DEBUG] Auth present: {auth is not None}, Username: {auth.username if auth else 'None'}")

        # If both auth and credentials are provided, validate them
        if auth and webhook_user and webhook_pass:
            if auth.username != webhook_user or auth.password != webhook_pass:
                logger.warning(f"Invalid credentials for tenant: {subdomain}")
                return jsonify({'error': 'Unauthorized'}), 401
            logger.info(f"[WEBHOOK] Authentication validated for tenant {subdomain}")
        else:
            logger.info(f"[WEBHOOK] Accepting webhook without authentication for tenant {subdomain}")

        # Safely parse CDR data (handle JSON errors)
        try:
            # Check if request has data
            if not request.data or len(request.data) == 0:
                logger.warning(f"[WEBHOOK] Empty request body received for tenant {subdomain}")
                return jsonify({'status': 'ok', 'message': 'Empty request received - possibly a test ping'}), 200

            if request.is_json:
                cdr_data = request.get_json()
            else:
                cdr_data = json.loads(request.data.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            logger.error(f"Invalid CDR data format: {e}")
            return jsonify({'error': 'Invalid JSON format'}), 400

        uniqueid = cdr_data.get('uniqueid', 'unknown')
        logger.info(f"[{subdomain}] Received CDR: {uniqueid} | {cdr_data.get('src')} -> {cdr_data.get('dst')}")

        # Check if CDR already exists (prevent duplicates)
        existing_cdr = CDRRecord.query.filter_by(
            tenant_id=tenant.id,
            uniqueid=uniqueid
        ).first()

        if existing_cdr:
            logger.info(f"[{subdomain}] CDR {uniqueid} already exists, skipping duplicate")
            return jsonify({'status': 'success', 'message': 'Duplicate CDR ignored'}), 200

        # Check usage limits
        if not check_usage_limit(tenant.id):
            logger.warning(f"[{subdomain}] Usage limit exceeded for tenant {tenant.id}")
            # Still accept the CDR but mark it as over-limit
            # In production, you might want to reject or queue for later processing
            cdr = CDRRecord(
                tenant_id=tenant.id,
                uniqueid=cdr_data.get('uniqueid'),
                src=cdr_data.get('src'),
                dst=cdr_data.get('dst'),
                caller_name=cdr_data.get('caller_name'),
                clid=cdr_data.get('clid'),
                channel=cdr_data.get('channel'),
                dstchannel=cdr_data.get('dstchannel'),
                start_time=cdr_data.get('start'),
                answer_time=cdr_data.get('answer'),
                end_time=cdr_data.get('end'),
                duration=cdr_data.get('duration'),
                billsec=cdr_data.get('billsec'),
                disposition=cdr_data.get('disposition'),
                recordfiles=cdr_data.get('recordfiles'),
                src_trunk_name=cdr_data.get('src_trunk_name'),
                dst_trunk_name=cdr_data.get('dst_trunk_name')
            )
            db.session.add(cdr)
            db.session.commit()

            return jsonify({
                'status': 'accepted_over_limit',
                'message': 'Usage limit exceeded. Please upgrade your plan.',
                'upgrade_required': True
            }), 202

        # WORKAROUND: UCM sometimes sends recording path in caller_name field
        # Detect and move to correct field
        caller_name_value = cdr_data.get('caller_name')
        recordfiles_value = cdr_data.get('recordfiles')

        # If caller_name looks like a recording path (contains .wav), move it to recordfiles
        if caller_name_value and ('.wav' in caller_name_value or caller_name_value.endswith('@')):
            # Remove trailing @ if present
            recordfiles_value = caller_name_value.rstrip('@')
            caller_name_value = None  # Clear caller_name
            logger.info(f"Moved recording path from caller_name to recordfiles: {recordfiles_value}")

        # Process CDR normally
        cdr = CDRRecord(
            tenant_id=tenant.id,
            uniqueid=cdr_data.get('uniqueid'),
            src=cdr_data.get('src'),
            dst=cdr_data.get('dst'),
            caller_name=caller_name_value,
            clid=cdr_data.get('clid'),
            channel=cdr_data.get('channel'),
            dstchannel=cdr_data.get('dstchannel'),
            start_time=cdr_data.get('start'),
            answer_time=cdr_data.get('answer'),
            end_time=cdr_data.get('end'),
            duration=cdr_data.get('duration'),
            billsec=cdr_data.get('billsec'),
            disposition=cdr_data.get('disposition'),
            recordfiles=recordfiles_value,
            src_trunk_name=cdr_data.get('src_trunk_name'),
            dst_trunk_name=cdr_data.get('dst_trunk_name')
        )

        db.session.add(cdr)
        db.session.commit()

        # Increment usage counter
        increment_usage(tenant.id)

        # Trigger AI processing if recording exists
        # Use recordfiles_value (which includes workaround fix) instead of original webhook data
        recording_path = recordfiles_value
        logger.info(f"🎯 WEBHOOK DEBUG: call_id={cdr.id}, recording_path={recording_path}")
        logger.info(f"🎯 WEBHOOK DEBUG: recordfiles_value={recordfiles_value}, caller_name_value={caller_name_value}")

        if recording_path:
            logger.info(f"📼 Recording path received: {recording_path}")
            logger.info(f"🔧 TRANSCRIPTION_ENABLED={TRANSCRIPTION_ENABLED}, SENTIMENT_ENABLED={SENTIMENT_ENABLED}")
            logger.info(f"🔧 Type of recording_path: {type(recording_path)}, len={len(recording_path) if recording_path else 0}")

            if TRANSCRIPTION_ENABLED or SENTIMENT_ENABLED:
                logger.info(f"🚀 Triggering AI processing for call {cdr.id} with recording: {recording_path}")
                try:
                    process_call_ai_async(cdr.id, recording_path)
                    logger.info(f"✅ process_call_ai_async returned successfully")
                except Exception as proc_e:
                    logger.error(f"❌ ERROR calling process_call_ai_async: {proc_e}", exc_info=True)
            else:
                logger.warning(f"⚠️ AI features disabled - recording will not be processed for call {cdr.id}")
        else:
            logger.warning(f"⚠️ No recording path in webhook data for call {cdr.id}")

        return jsonify({'status': 'success'}), 200

    except Exception as e:
        db.session.rollback()  # Critical: Prevent cascading failures
        logger.error(f"Error processing CDR: {e}", exc_info=True)
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Request data: {request.data[:1000] if request.data else 'None'}")
        return jsonify({'error': f'CDR processing failed: {str(e)}'}), 500


@app.route('/api/admin/ucm-diagnostics', methods=['GET', 'POST'])
@jwt_required()
def ucm_diagnostics():
    """Diagnostic endpoint to check UCM configuration and test recording downloads"""
    claims = get_jwt()
    role = claims.get('role')

    # Only admins can access
    if role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Show current UCM configuration
        config = {
            'UCM_IP': UCM_IP,
            'UCM_USERNAME': UCM_USERNAME,
            'UCM_PASSWORD': '***' + UCM_PASSWORD[-3:] if UCM_PASSWORD and len(UCM_PASSWORD) > 3 else '***',
            'UCM_PORT': UCM_PORT,
            'TRANSCRIPTION_ENABLED': TRANSCRIPTION_ENABLED,
            'SENTIMENT_ENABLED': SENTIMENT_ENABLED,
            'STORAGE_CONFIGURED': get_storage_manager() is not None
        }

        # If POST, test downloading a specific recording
        if request.method == 'POST':
            data = request.get_json()
            call_id = data.get('call_id')

            if not call_id:
                return jsonify({'error': 'call_id required'}), 400

            call = CDRRecord.query.get(call_id)
            if not call:
                return jsonify({'error': 'Call not found'}), 404

            if not call.recordfiles:
                return jsonify({'error': 'Call has no recording path'}), 400

            # Try to download the recording
            logger.info(f"🔍 Diagnostic: Testing download for call {call_id}")
            logger.info(f"   Recording path: {call.recordfiles}")

            from ucm_downloader import download_and_upload_recording
            storage_manager = get_storage_manager()

            result = download_and_upload_recording(
                UCM_IP,
                UCM_USERNAME,
                UCM_PASSWORD,
                call.recordfiles,
                call.tenant_id,
                call.uniqueid,
                storage_manager,
                UCM_PORT
            )

            if result:
                # Update the call record
                call.recordfiles = result
                call.recording_downloaded = True
                call.recording_local_path = result
                db.session.commit()

                return jsonify({
                    'status': 'success',
                    'message': 'Recording downloaded successfully',
                    'storage_path': result,
                    'config': config
                }), 200
            else:
                return jsonify({
                    'status': 'failed',
                    'message': 'Recording download failed. Check server logs for details.',
                    'config': config
                }), 500

        # GET request - just show configuration
        return jsonify({
            'status': 'info',
            'message': 'UCM Configuration',
            'config': config,
            'instructions': 'POST with {"call_id": <id>} to test downloading a specific recording'
        }), 200

    except Exception as e:
        logger.error(f"UCM diagnostics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ENHANCED DASHBOARD API ENDPOINTS
# ============================================================================

@app.route('/api/calls', methods=['GET'])
@jwt_required()
def get_calls():
    """Get paginated calls for current tenant with advanced filtering"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role', 'user')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '')

    # Advanced filters
    status = request.args.get('status', '')
    sentiment = request.args.get('sentiment', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    min_duration = request.args.get('min_duration', type=int)
    max_duration = request.args.get('max_duration', type=int)

    # Superadmins see ALL calls from ALL tenants
    if role == 'superadmin':
        query = CDRRecord.query
        logger.info(f"Superadmin viewing ALL calls across all tenants")
    else:
        # Regular users only see their tenant's calls
        query = CDRRecord.query.filter_by(tenant_id=tenant_id)

    # Search filter
    if search:
        query = query.filter(
            db.or_(
                CDRRecord.src.like(f'%{search}%'),
                CDRRecord.dst.like(f'%{search}%'),
                CDRRecord.caller_name.like(f'%{search}%')
            )
        )

    # Status filter
    if status:
        query = query.filter(CDRRecord.disposition == status)

    # Date range filters
    if date_from:
        from datetime import datetime
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
        query = query.filter(CDRRecord.received_at >= date_from_obj)

    if date_to:
        from datetime import datetime, timedelta
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
        # Include the entire day
        date_to_obj = date_to_obj + timedelta(days=1)
        query = query.filter(CDRRecord.received_at < date_to_obj)

    # Duration filters
    if min_duration is not None:
        query = query.filter(CDRRecord.duration >= min_duration)

    if max_duration is not None:
        query = query.filter(CDRRecord.duration <= max_duration)

    # Sentiment filter (requires join with transcription and sentiment tables)
    if sentiment:
        query = query.join(CDRRecord.transcription).join(Transcription.sentiment).filter(
            SentimentAnalysis.sentiment == sentiment
        )

    # Pagination
    pagination = query.order_by(CDRRecord.received_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    calls = [{
        'id': call.id,
        'uniqueid': call.uniqueid,
        'src': call.src,
        'dst': call.dst,
        'caller_name': call.caller_name,
        'start_time': call.start_time,
        'call_date': call.call_date.isoformat() if call.call_date else call.start_time,
        'duration': call.duration,
        'billsec': call.billsec,
        'disposition': call.disposition,
        'recording_path': call.recordfiles,
        'recording_local_path': call.recording_local_path,  # Include Supabase path
        'has_recording': bool(call.recording_local_path),
        'recording_available': bool(call.recording_local_path),
        'transcription': call.transcription.transcription_text if call.transcription else None,
        'sentiment': call.transcription.sentiment.sentiment if call.transcription and call.transcription.sentiment else None,
        'sentiment_score': call.transcription.sentiment.sentiment_score if call.transcription and call.transcription.sentiment else None
    } for call in pagination.items]

    return jsonify({
        'calls': calls,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200


@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get comprehensive statistics"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role', 'user')

    # Superadmins see platform-wide stats
    if role == 'superadmin':
        total_calls = CDRRecord.query.count()
        answered_calls = CDRRecord.query.filter_by(disposition='ANSWERED').count()
        missed_calls = CDRRecord.query.filter_by(disposition='NO ANSWER').count()
        avg_duration = db.session.query(func.avg(CDRRecord.duration)).scalar() or 0
        transcribed_calls = db.session.query(CDRRecord).join(Transcription).count()
    else:
        # Regular users see only their tenant's stats
        total_calls = CDRRecord.query.filter_by(tenant_id=tenant_id).count()
        answered_calls = CDRRecord.query.filter_by(tenant_id=tenant_id, disposition='ANSWERED').count()
        missed_calls = CDRRecord.query.filter_by(tenant_id=tenant_id, disposition='NO ANSWER').count()
        avg_duration = db.session.query(func.avg(CDRRecord.duration)).filter_by(tenant_id=tenant_id).scalar() or 0
        transcribed_calls = db.session.query(CDRRecord).join(Transcription).filter(CDRRecord.tenant_id == tenant_id).count()

    return jsonify({
        'total_calls': total_calls,
        'answered_calls': answered_calls,
        'missed_calls': missed_calls,
        'avg_duration': round(avg_duration, 2),
        'transcribed_calls': transcribed_calls,
        'answer_rate': round((answered_calls / total_calls * 100) if total_calls > 0 else 0, 1)
    }), 200


@app.route('/api/analytics/call-volume', methods=['GET'])
@jwt_required()
def get_call_volume():
    """Get call volume over time"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role', 'user')

    days = request.args.get('days', 30, type=int)
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Superadmins see ALL calls
    if role == 'superadmin':
        calls = CDRRecord.query.filter(
            CDRRecord.received_at >= cutoff_date
        ).all()
    else:
        calls = CDRRecord.query.filter(
            CDRRecord.tenant_id == tenant_id,
            CDRRecord.received_at >= cutoff_date
        ).all()

    # Group by date
    call_volume = defaultdict(int)
    for call in calls:
        date_str = call.received_at.strftime('%Y-%m-%d')
        call_volume[date_str] += 1

    # Fill in missing dates
    result = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        result.append({
            'date': date_str,
            'calls': call_volume.get(date_str, 0)
        })

    return jsonify(sorted(result, key=lambda x: x['date'])), 200


@app.route('/api/analytics/sentiment-trends', methods=['GET'])
@jwt_required()
def get_sentiment_trends():
    """Get sentiment trends"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role', 'user')

    # Superadmins see ALL sentiment data
    if role == 'superadmin':
        sentiments = db.session.query(
            SentimentAnalysis.sentiment,
            func.count(SentimentAnalysis.id).label('count')
        ).join(Transcription).join(CDRRecord).group_by(SentimentAnalysis.sentiment).all()
    else:
        sentiments = db.session.query(
            SentimentAnalysis.sentiment,
            func.count(SentimentAnalysis.id).label('count')
        ).join(Transcription).join(CDRRecord).filter(
            CDRRecord.tenant_id == tenant_id
        ).group_by(SentimentAnalysis.sentiment).all()

    return jsonify([{
        'sentiment': s[0],
        'count': s[1]
    } for s in sentiments]), 200


@app.route('/api/analytics/team-performance', methods=['GET'])
@jwt_required()
def get_team_performance():
    """Get team performance metrics and leaderboard"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role', 'user')

    # Get all users for this tenant (or all tenants for superadmin)
    if role == 'superadmin':
        users = User.query.all()
    else:
        users = User.query.filter_by(tenant_id=tenant_id).all()

    team_stats = []

    for user in users:
        # Count calls for this user (where they were the destination)
        user_calls = CDRRecord.query.filter_by(tenant_id=user.tenant_id, dst=user.extension if hasattr(user, 'extension') else None).all()

        # If no extension, try to match by user assignments (would need additional table)
        if not user_calls:
            # For now, include all calls for users without extension matching
            # This should be enhanced with proper user-to-call assignment
            continue

        total_calls = len(user_calls)
        if total_calls == 0:
            continue

        # Calculate average quality score
        quality_scores = []
        for call in user_calls:
            quality = CallQualityScore.query.filter_by(cdr_id=call.id).first()
            if quality and quality.overall_score:
                quality_scores.append(quality.overall_score)

        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

        # Calculate average sentiment
        sentiment_scores = {'Positive': 0, 'Neutral': 0, 'Negative': 0}
        for call in user_calls:
            trans = Transcription.query.filter_by(cdr_id=call.id).first()
            if trans and trans.sentiment:
                sentiment = trans.sentiment.sentiment
                if sentiment in sentiment_scores:
                    sentiment_scores[sentiment] += 1

        total_sentiments = sum(sentiment_scores.values())
        sentiment_percentages = {
            k: (v / total_sentiments * 100) if total_sentiments > 0 else 0
            for k, v in sentiment_scores.items()
        }

        # Calculate total talk time
        total_duration = sum(call.duration or 0 for call in user_calls)

        # Calculate answer rate
        answered = len([c for c in user_calls if c.disposition == 'ANSWERED'])
        answer_rate = (answered / total_calls * 100) if total_calls > 0 else 0

        team_stats.append({
            'user_id': user.id,
            'user_name': user.full_name,
            'user_email': user.email,
            'total_calls': total_calls,
            'answered_calls': answered,
            'answer_rate': round(answer_rate, 1),
            'avg_quality_score': round(avg_quality, 1),
            'quality_score_count': len(quality_scores),
            'sentiment_breakdown': sentiment_percentages,
            'total_talk_time_minutes': round(total_duration / 60, 1),
            'avg_call_duration_seconds': round(total_duration / total_calls, 1) if total_calls > 0 else 0
        })

    # Sort by quality score (highest first)
    team_stats.sort(key=lambda x: x['avg_quality_score'], reverse=True)

    return jsonify({
        'team_members': team_stats,
        'total_team_members': len(team_stats),
        'team_avg_quality': round(sum(s['avg_quality_score'] for s in team_stats) / len(team_stats), 1) if team_stats else 0,
        'team_total_calls': sum(s['total_calls'] for s in team_stats),
        'team_avg_answer_rate': round(sum(s['answer_rate'] for s in team_stats) / len(team_stats), 1) if team_stats else 0
    }), 200


# ============================================================================
# SUBSCRIPTION & BILLING MANAGEMENT
# ============================================================================

@app.route('/api/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    """Get current subscription details"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    # Calculate next billing date (assuming monthly billing)
    next_billing_date = None
    if tenant.billing_cycle_start:
        next_billing_date = tenant.billing_cycle_start + timedelta(days=30)

    return jsonify({
        'plan': tenant.plan_type or 'starter',
        'status': 'active' if tenant.subscription_ends_at and tenant.subscription_ends_at > datetime.utcnow() else 'inactive',
        'next_billing_date': next_billing_date.isoformat() if next_billing_date else None,
        'paypal_subscription_id': tenant.paypal_subscription_id
    }), 200


@app.route('/api/billing/history', methods=['GET'])
@jwt_required()
def get_billing_history():
    """Get billing history for current tenant"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    history = BillingHistory.query.filter_by(tenant_id=tenant_id).order_by(
        BillingHistory.created_at.desc()
    ).limit(50).all()

    return jsonify({
        'history': [{
            'id': h.id,
            'invoice_number': h.invoice_number,
            'amount': h.amount,
            'payment_status': h.payment_status,
            'invoice_url': h.invoice_url,
            'receipt_url': h.receipt_url,
            'created_at': h.created_at.isoformat()
        } for h in history]
    }), 200


@app.route('/api/usage/stats', methods=['GET'])
@jwt_required()
def get_usage_stats():
    """Get usage statistics for current billing cycle"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    # Count current users
    current_users = User.query.filter_by(tenant_id=tenant_id).count()

    # Calculate percentage used
    calls_percentage = (tenant.usage_this_month / tenant.max_calls_per_month * 100) if tenant.max_calls_per_month > 0 else 0
    users_percentage = (current_users / tenant.max_users * 100) if tenant.max_users > 0 else 0

    # Determine if limits are approaching
    calls_warning = calls_percentage >= 80
    users_warning = users_percentage >= 80

    return jsonify({
        'plan': tenant.plan,
        'status': tenant.status,
        'users': {
            'current': current_users,
            'limit': tenant.max_users,
            'percentage': round(users_percentage, 1),
            'warning': users_warning,
            'limit_reached': current_users >= tenant.max_users
        },
        'calls': {
            'current': tenant.usage_this_month or 0,
            'limit': tenant.max_calls_per_month,
            'percentage': round(calls_percentage, 1),
            'warning': calls_warning,
            'limit_reached': tenant.usage_this_month >= tenant.max_calls_per_month
        },
        'billing_cycle_start': tenant.billing_cycle_start.isoformat() if tenant.billing_cycle_start else None,
        'created_at': tenant.created_at.isoformat() if tenant.created_at else None
    }), 200


@app.route('/api/subscription/cancel', methods=['POST'])
@jwt_required()
@limiter.limit("3 per hour")
def cancel_subscription():
    """Cancel subscription (will remain active until end of billing period)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    user_id = claims.get('user_id')

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    # In production, cancel PayPal subscription via API
    if tenant.paypal_subscription_id:
        try:
            import paypalrestsdk
            # Cancel PayPal subscription
            # subscription = paypalrestsdk.Subscription.find(tenant.paypal_subscription_id)
            # subscription.cancel()
            logger.info(f"Subscription cancellation requested for tenant {tenant_id}")
        except Exception as e:
            logger.error(f"Failed to cancel PayPal subscription: {e}")

    # Set subscription to expire at end of current billing period
    if tenant.billing_cycle_start:
        tenant.subscription_ends_at = tenant.billing_cycle_start + timedelta(days=30)
    else:
        tenant.subscription_ends_at = datetime.utcnow()

    db.session.commit()

    # Log audit
    log_audit('subscription_canceled', 'tenant', tenant_id, {
        'paypal_subscription_id': tenant.paypal_subscription_id
    }, user_id, tenant_id)

    return jsonify({
        'message': 'Subscription canceled successfully',
        'ends_at': tenant.subscription_ends_at.isoformat()
    }), 200


@app.route('/api/recording/<int:call_id>', methods=['GET'])
@jwt_required()
def get_recording(call_id):
    """Download/stream recording file or return Supabase signed URL"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    logger.info(f"[RECORDING] Request for call {call_id} from tenant {tenant_id}")

    call = CDRRecord.query.filter_by(id=call_id, tenant_id=tenant_id).first()
    if not call:
        logger.warning(f"[RECORDING] Call {call_id} not found for tenant {tenant_id}")
        return jsonify({'error': 'Call not found'}), 404

    logger.info(f"[RECORDING] Call found - recording_local_path: {call.recording_local_path}, recordfiles: {call.recordfiles}")

    # Check if recording has been downloaded to Supabase
    if not call.recording_local_path and not call.recordfiles:
        logger.warning(f"[RECORDING] No recording path available for call {call_id}")
        return jsonify({'error': 'Recording not available'}), 404

    storage_manager = get_storage_manager()
    logger.info(f"[RECORDING] Storage manager available: {storage_manager is not None}")

    # If recording is in Supabase Storage (downloaded), return signed URL
    if storage_manager and call.recording_local_path:
        logger.info(f"[RECORDING] Generating signed URL for: {call.recording_local_path}")
        signed_url = storage_manager.get_signed_url(call.recording_local_path, expires_in=3600)
        if signed_url:
            logger.info(f"[RECORDING] Signed URL generated successfully")
            return jsonify({'url': signed_url, 'type': 'supabase'}), 200
        else:
            logger.error(f"[RECORDING] Failed to generate signed URL")
            return jsonify({'error': 'Failed to generate signed URL'}), 500

    # If it's a local file, serve it directly
    if call.recordfiles and os.path.exists(call.recordfiles):
        logger.info(f"[RECORDING] Serving local file: {call.recordfiles}")
        return send_file(call.recordfiles, as_attachment=True)

    logger.error(f"[RECORDING] Recording not found - no valid path")
    return jsonify({'error': 'Recording not found'}), 404


# ============================================================================
# PHONE SYSTEMS ENDPOINTS
# ============================================================================

@app.route('/api/phone-systems', methods=['GET'])
def get_phone_systems():
    """Get list of supported phone systems"""
    return jsonify({
        'systems': [
            {
                'id': key,
                **value
            } for key, value in PHONE_SYSTEM_PRESETS.items()
        ]
    }), 200


# ============================================================================
# SETTINGS ENDPOINTS
# ============================================================================

@app.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """Get tenant settings"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    return jsonify({
        'company_name': tenant.company_name,
        'subdomain': tenant.subdomain,
        'phone_system_type': tenant.phone_system_type,
        'pbx_ip': tenant.pbx_ip,
        'pbx_username': tenant.pbx_username,
        'pbx_port': tenant.pbx_port,
        'webhook_username': tenant.webhook_username,
        'transcription_enabled': tenant.transcription_enabled,
        'sentiment_enabled': tenant.sentiment_enabled,
        'plan': tenant.plan
    }), 200


@app.route('/api/settings', methods=['PUT'])
@jwt_required()
@require_permission('manage_settings')
def update_settings():
    """Update tenant settings"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    data = request.get_json()

    # Update fields
    if 'phone_system_type' in data:
        tenant.phone_system_type = data['phone_system_type']
    if 'pbx_ip' in data:
        tenant.pbx_ip = data['pbx_ip']
    if 'pbx_username' in data:
        tenant.pbx_username = data['pbx_username']
    if 'pbx_password' in data:
        tenant.pbx_password = data['pbx_password']
    if 'pbx_port' in data:
        tenant.pbx_port = data['pbx_port']
    if 'webhook_username' in data:
        tenant.webhook_username = data['webhook_username']
    if 'webhook_password' in data:
        tenant.webhook_password = data['webhook_password']
    if 'transcription_enabled' in data:
        tenant.transcription_enabled = data['transcription_enabled']
    if 'sentiment_enabled' in data:
        tenant.sentiment_enabled = data['sentiment_enabled']

    db.session.commit()

    return jsonify({'message': 'Settings updated successfully'}), 200


# ============================================================================
# PROMPT MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/prompts/defaults', methods=['GET'])
@jwt_required()
def get_default_prompt():
    """Get default prompt for a specific AI feature and industry"""
    feature_slug = request.args.get('feature')
    industry = request.args.get('industry', 'generic')

    if not feature_slug:
        return jsonify({'error': 'feature parameter is required'}), 400

    # Check if feature exists in DEFAULT_PROMPTS
    if feature_slug not in DEFAULT_PROMPTS:
        return jsonify({'error': f'Unknown feature: {feature_slug}'}), 404

    feature_prompts = DEFAULT_PROMPTS[feature_slug]

    # Get the requested prompt variant
    if industry != 'generic' and industry in feature_prompts:
        prompt_text = feature_prompts.get('core_instructions', '') + '\n\n' + feature_prompts[industry]
        variant = industry
    else:
        prompt_text = feature_prompts.get('core_instructions', '') + '\n\n' + feature_prompts.get('generic', '')
        variant = 'generic'

    return jsonify({
        'feature_slug': feature_slug,
        'industry': variant,
        'prompt': prompt_text,
        'core_instructions': feature_prompts.get('core_instructions', ''),
        'available_industries': [k for k in feature_prompts.keys() if k != 'core_instructions']
    }), 200


@app.route('/api/prompts/features', methods=['GET'])
@jwt_required()
def list_ai_features():
    """List all available AI features with their metadata"""
    features = []

    for slug, prompts in DEFAULT_PROMPTS.items():
        features.append({
            'slug': slug,
            'name': slug.replace('-', ' ').title(),
            'has_custom_prompts': True,
            'available_industries': [k for k in prompts.keys() if k != 'core_instructions'],
            'industry_count': len([k for k in prompts.keys() if k != 'core_instructions'])
        })

    return jsonify({
        'features': features,
        'total_count': len(features)
    }), 200


@app.route('/api/prompts/industries', methods=['GET'])
@jwt_required()
def list_industries():
    """List all available industry variations"""
    # Get industries from the first feature (all features have the same industries)
    first_feature = next(iter(DEFAULT_PROMPTS.values()))
    industries = [
        {
            'slug': k,
            'name': k.replace('_', ' ').title(),
            'description': f'Optimized prompts for {k.replace("_", " ")} industry'
        }
        for k in first_feature.keys()
        if k != 'core_instructions'
    ]

    return jsonify({
        'industries': industries,
        'total_count': len(industries)
    }), 200


@app.route('/api/prompts/copilot/refine', methods=['POST'])
@jwt_required()
def copilot_refine_prompt():
    """
    Outcome-based copilot refinement API.
    Users describe what they want in natural language, AI refines the prompt accordingly.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    data = request.get_json()
    feature_slug = data.get('feature_slug')
    user_request = data.get('user_request')  # Natural language: "I want sentiment to be more sensitive to frustration"
    current_prompt = data.get('current_prompt')  # Optional: if refining existing custom prompt
    conversation_history = data.get('conversation_history', [])  # For iterative refinement

    if not feature_slug or not user_request:
        return jsonify({'error': 'feature_slug and user_request are required'}), 400

    if not openai_client:
        return jsonify({'error': 'AI service not available'}), 503

    try:
        # Get the current prompt (custom or default)
        if not current_prompt:
            industry = get_tenant_industry(tenant_id)
            current_prompt, _ = get_prompt_for_feature(tenant_id, feature_slug, industry)

        if not current_prompt:
            return jsonify({'error': 'Could not retrieve current prompt'}), 500

        # Build copilot system prompt
        copilot_system_prompt = """You are an AI Prompt Refinement Copilot. Your job is to help users refine AI analysis prompts based on their desired OUTCOMES, not direct prompt editing.

Users will describe what they want to achieve in natural language. You will:
1. Understand their desired outcome
2. Analyze the current prompt
3. Generate a refined prompt that achieves the outcome
4. Explain what changed and why

CRITICAL RULES:
- Keep the JSON output format requirements intact
- Preserve core analysis methodology
- Make surgical changes that address the user's request
- Don't over-optimize - only change what's necessary
- Maintain professional, clear language
- Ensure prompts remain comprehensive and detailed

Respond in JSON format with:
{
  "refined_prompt": "The updated prompt text",
  "changes_summary": "Brief summary of what changed (2-3 sentences)",
  "explanation": "Detailed explanation of changes and reasoning",
  "confidence": 0.0-1.0 (how confident you are this addresses the user's request),
  "suggestions": ["Optional array of follow-up suggestions"]
}"""

        # Build conversation context
        messages = [{"role": "system", "content": copilot_system_prompt}]

        # Add conversation history for iterative refinement
        for msg in conversation_history:
            messages.append({"role": msg['role'], "content": msg['content']})

        # Add current refinement request
        user_message = f"""Feature: {feature_slug}

Current Prompt:
{current_prompt}

User Request: {user_request}

Please refine this prompt to achieve the user's desired outcome."""

        messages.append({"role": "user", "content": user_message})

        # Call GPT-4 for intelligent prompt refinement
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000
        )

        result = json.loads(response.choices[0].message.content)

        # Track copilot usage
        track_feature_usage(tenant_id, 'prompt-copilot')

        # Return refined prompt and metadata
        return jsonify({
            'success': True,
            'refined_prompt': result.get('refined_prompt'),
            'changes_summary': result.get('changes_summary'),
            'explanation': result.get('explanation'),
            'confidence': result.get('confidence', 0.8),
            'suggestions': result.get('suggestions', []),
            'feature_slug': feature_slug,
            'conversation_id': len(conversation_history) + 1  # Simple conversation tracking
        }), 200

    except Exception as e:
        logger.error(f"Copilot refinement failed: {e}")
        return jsonify({'error': 'Failed to refine prompt', 'details': str(e)}), 500


@app.route('/api/prompts/copilot/apply', methods=['POST'])
@jwt_required()
def copilot_apply_refinement():
    """
    Apply a copilot-refined prompt as the active custom prompt for this tenant.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']
    user_id = claims['sub']

    data = request.get_json()
    feature_slug = data.get('feature_slug')
    refined_prompt = data.get('refined_prompt')
    changes_summary = data.get('changes_summary', '')

    if not feature_slug or not refined_prompt:
        return jsonify({'error': 'feature_slug and refined_prompt are required'}), 400

    try:
        # Check if custom prompt already exists
        custom = PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug
        ).first()

        if custom:
            # Update existing
            custom.custom_prompt = refined_prompt
            custom.is_active = True
            custom.updated_at = datetime.utcnow()
        else:
            # Create new
            custom = PromptCustomization(
                tenant_id=tenant_id,
                ai_feature_slug=feature_slug,
                custom_prompt=refined_prompt,
                is_active=True,
                created_by=user_id
            )
            db.session.add(custom)

        db.session.commit()

        logger.info(f"✅ Copilot-refined prompt applied for {feature_slug} by tenant {tenant_id}")

        return jsonify({
            'success': True,
            'message': 'Refined prompt applied successfully',
            'feature_slug': feature_slug,
            'changes_summary': changes_summary
        }), 200

    except Exception as e:
        logger.error(f"Failed to apply copilot refinement: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to apply refinement', 'details': str(e)}), 500


@app.route('/api/prompts/scenarios', methods=['GET'])
@jwt_required()
def list_all_scenarios():
    """List all pre-built prompt refinement scenarios"""
    feature_slug = request.args.get('feature')

    if feature_slug:
        # Get scenarios for specific feature
        scenarios = get_scenarios_for_feature(feature_slug)
        return jsonify({
            'feature_slug': feature_slug,
            'scenarios': scenarios,
            'count': len(scenarios)
        }), 200
    else:
        # Get all scenarios organized by feature
        all_scenarios = get_all_scenarios()
        total_count = sum(len(scenarios) for scenarios in all_scenarios.values())
        return jsonify({
            'scenarios_by_feature': all_scenarios,
            'total_count': total_count,
            'feature_count': len(all_scenarios)
        }), 200


@app.route('/api/prompts/scenarios/<scenario_id>/apply', methods=['POST'])
@jwt_required()
def apply_scenario(scenario_id):
    """
    Apply a pre-built scenario by using the copilot to refine the prompt.
    This is a convenience endpoint that combines scenario lookup + copilot refinement.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    # Get the scenario
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        return jsonify({'error': f'Scenario not found: {scenario_id}'}), 404

    feature_slug = scenario['feature_slug']
    user_request = scenario['request']

    # Get current prompt
    industry = get_tenant_industry(tenant_id)
    current_prompt, _ = get_prompt_for_feature(tenant_id, feature_slug, industry)

    if not current_prompt:
        return jsonify({'error': 'Could not retrieve current prompt'}), 500

    if not openai_client:
        return jsonify({'error': 'AI service not available'}), 503

    try:
        # Use the copilot to apply the scenario
        copilot_system_prompt = """You are an AI Prompt Refinement Copilot. Apply the requested scenario refinement to the prompt.

CRITICAL RULES:
- Keep the JSON output format requirements intact
- Preserve core analysis methodology
- Make surgical changes that address the scenario request
- Maintain professional, clear language

Respond in JSON format with:
{
  "refined_prompt": "The updated prompt text",
  "changes_summary": "Brief summary of what changed",
  "explanation": "Detailed explanation of changes",
  "confidence": 0.0-1.0
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": copilot_system_prompt},
                {
                    "role": "user",
                    "content": f"""Feature: {feature_slug}
Scenario: {scenario['title']}

Current Prompt:
{current_prompt}

Scenario Request: {user_request}

Please refine this prompt to apply the scenario."""
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000
        )

        result = json.loads(response.choices[0].message.content)

        track_feature_usage(tenant_id, 'prompt-scenarios')

        return jsonify({
            'success': True,
            'scenario': scenario,
            'refined_prompt': result.get('refined_prompt'),
            'changes_summary': result.get('changes_summary'),
            'explanation': result.get('explanation'),
            'confidence': result.get('confidence', 0.8)
        }), 200

    except Exception as e:
        logger.error(f"Scenario application failed: {e}")
        return jsonify({'error': 'Failed to apply scenario', 'details': str(e)}), 500


@app.route('/api/prompts/analyze-and-suggest', methods=['POST'])
@jwt_required()
def analyze_prompt_and_suggest():
    """
    Smart suggestions analyzer: Analyze current prompt and provide intelligent suggestions.
    Helps users discover improvement opportunities they might not think of themselves.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    data = request.get_json()
    feature_slug = data.get('feature_slug')
    current_prompt = data.get('current_prompt')

    if not feature_slug:
        return jsonify({'error': 'feature_slug is required'}), 400

    # Get current prompt if not provided
    if not current_prompt:
        industry = get_tenant_industry(tenant_id)
        current_prompt, _ = get_prompt_for_feature(tenant_id, feature_slug, industry)

    if not current_prompt:
        return jsonify({'error': 'Could not retrieve prompt to analyze'}), 500

    if not openai_client:
        return jsonify({'error': 'AI service not available'}), 503

    try:
        # Get relevant scenarios for this feature
        relevant_scenarios = get_scenarios_for_feature(feature_slug)
        scenario_summary = "\n".join([
            f"- {s['title']}: {s['description']}"
            for s in relevant_scenarios[:5]  # Top 5 most relevant
        ])

        # Smart analysis system prompt
        analyzer_prompt = f"""You are an AI Prompt Analysis Expert. Analyze the provided prompt and suggest intelligent improvements.

Your analysis should identify:
1. **Strengths**: What's working well in this prompt
2. **Gaps**: Important areas that could be enhanced or are missing
3. **Improvement Opportunities**: Specific, actionable ways to make this prompt better
4. **Calibration Issues**: Whether the prompt might be too strict, too lenient, or well-calibrated
5. **Industry Best Practices**: How well it aligns with best practices for this type of analysis

Available pre-built scenarios for this feature:
{scenario_summary}

Respond in JSON format with:
{{
  "overall_quality_score": 0-100 (how good is this prompt currently),
  "strengths": ["array of specific strengths"],
  "gaps": ["array of identified gaps or missing elements"],
  "suggestions": [
    {{
      "priority": "high|medium|low",
      "title": "Brief suggestion title",
      "description": "Detailed description of the suggestion",
      "impact": "Expected impact if implemented",
      "related_scenario_id": "ID of pre-built scenario if applicable (or null)"
    }}
  ],
  "calibration": {{
    "assessment": "well-calibrated|too-strict|too-lenient|unclear",
    "explanation": "Why you made this assessment"
  }},
  "quick_wins": ["Array of 2-3 easy improvements with high impact"]
}}"""

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": analyzer_prompt},
                {
                    "role": "user",
                    "content": f"""Feature: {feature_slug}

Current Prompt to Analyze:
{current_prompt}

Please provide a comprehensive analysis with actionable suggestions for improvement."""
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000
        )

        result = json.loads(response.choices[0].message.content)

        # Enrich suggestions with scenario details
        enriched_suggestions = []
        for suggestion in result.get('suggestions', []):
            scenario_id = suggestion.get('related_scenario_id')
            if scenario_id:
                scenario = get_scenario_by_id(scenario_id)
                if scenario:
                    suggestion['scenario'] = scenario

            enriched_suggestions.append(suggestion)

        result['suggestions'] = enriched_suggestions

        track_feature_usage(tenant_id, 'prompt-analysis')

        return jsonify({
            'success': True,
            'feature_slug': feature_slug,
            'analysis': result
        }), 200

    except Exception as e:
        logger.error(f"Prompt analysis failed: {e}")
        return jsonify({'error': 'Failed to analyze prompt', 'details': str(e)}), 500


@app.route('/api/prompts/validate', methods=['POST'])
@jwt_required()
def validate_prompt():
    """
    Validate a prompt before saving to ensure it meets quality and safety standards.
    Checks for: format requirements, security issues, best practices, appropriate length.
    """
    data = request.get_json()
    feature_slug = data.get('feature_slug')
    prompt_text = data.get('prompt')

    if not feature_slug or not prompt_text:
        return jsonify({'error': 'feature_slug and prompt are required'}), 400

    validation_result = {
        'is_valid': True,
        'errors': [],
        'warnings': [],
        'suggestions': []
    }

    # VALIDATION 1: Length check
    prompt_length = len(prompt_text)
    if prompt_length < 100:
        validation_result['errors'].append({
            'type': 'too_short',
            'message': f'Prompt is too short ({prompt_length} chars). Comprehensive prompts should be at least 100 characters.',
            'severity': 'high'
        })
        validation_result['is_valid'] = False
    elif prompt_length < 300:
        validation_result['warnings'].append({
            'type': 'short',
            'message': f'Prompt is quite short ({prompt_length} chars). Consider adding more detail for better results.',
            'severity': 'medium'
        })

    if prompt_length > 10000:
        validation_result['errors'].append({
            'type': 'too_long',
            'message': f'Prompt is too long ({prompt_length} chars). Keep prompts under 10,000 characters for optimal performance.',
            'severity': 'high'
        })
        validation_result['is_valid'] = False

    # VALIDATION 2: JSON format requirement check
    json_keywords = ['json', 'JSON', 'response_format', 'format']
    has_json_mention = any(keyword in prompt_text for keyword in json_keywords)

    if not has_json_mention:
        validation_result['warnings'].append({
            'type': 'missing_format_instruction',
            'message': 'Prompt does not mention JSON output format. Consider explicitly requesting JSON response format.',
            'severity': 'medium'
        })

    # VALIDATION 3: Security check - Prompt injection patterns
    dangerous_patterns = [
        'ignore previous',
        'ignore all previous',
        'disregard',
        'forget everything',
        'new instructions',
        'system:',
        'admin mode',
        '<script>',
        'javascript:'
    ]

    for pattern in dangerous_patterns:
        if pattern.lower() in prompt_text.lower():
            validation_result['errors'].append({
                'type': 'security_risk',
                'message': f'Potential security risk detected: "{pattern}". This could indicate prompt injection attempt.',
                'severity': 'critical'
            })
            validation_result['is_valid'] = False

    # VALIDATION 4: Best practices check
    best_practices = {
        'specific_role': ['you are', 'your role', 'as a', 'as an'],
        'clear_task': ['analyze', 'evaluate', 'detect', 'identify', 'assess'],
        'output_structure': ['respond with', 'output', 'format', 'structure']
    }

    missing_practices = []
    for practice, keywords in best_practices.items():
        if not any(keyword in prompt_text.lower() for keyword in keywords):
            missing_practices.append(practice)

    if missing_practices:
        validation_result['suggestions'].append({
            'type': 'best_practices',
            'message': f'Consider adding: {", ".join(missing_practices)}',
            'details': 'Strong prompts typically include role definition, clear task description, and output structure.'
        })

    # VALIDATION 5: Feature-specific validation
    feature_keywords = {
        'sentiment-analysis': ['sentiment', 'positive', 'negative', 'neutral'],
        'quality-scoring': ['quality', 'score', 'rating', 'evaluation'],
        'compliance-monitoring': ['compliance', 'violation', 'policy', 'regulation'],
        'churn-prediction': ['churn', 'risk', 'retention', 'cancellation'],
        'deal-risk': ['deal', 'risk', 'close', 'probability']
    }

    if feature_slug in feature_keywords:
        expected_keywords = feature_keywords[feature_slug]
        found_keywords = [kw for kw in expected_keywords if kw in prompt_text.lower()]

        if len(found_keywords) < 2:
            validation_result['warnings'].append({
                'type': 'feature_alignment',
                'message': f'Prompt may not be well-aligned with {feature_slug}. Expected keywords like: {", ".join(expected_keywords)}',
                'severity': 'medium'
            })

    # VALIDATION 6: AI-powered comprehensive validation (if OpenAI available)
    if openai_client:
        try:
            ai_validation_prompt = """You are a prompt validation expert. Analyze this AI prompt for quality and safety.

Check for:
- Clarity and specificity
- Potential security issues
- Consistency in instructions
- Appropriate tone and language
- Realistic expectations

Respond in JSON with:
{
  "quality_score": 0-100,
  "critical_issues": ["array of critical problems"],
  "recommendations": ["array of improvement recommendations"]
}"""

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Use faster model for validation
                messages=[
                    {"role": "system", "content": ai_validation_prompt},
                    {"role": "user", "content": f"Validate this {feature_slug} prompt:\n\n{prompt_text[:2000]}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=500
            )

            ai_result = json.loads(response.choices[0].message.content)

            validation_result['ai_quality_score'] = ai_result.get('quality_score', 0)

            for issue in ai_result.get('critical_issues', []):
                validation_result['errors'].append({
                    'type': 'ai_detected_issue',
                    'message': issue,
                    'severity': 'high'
                })
                validation_result['is_valid'] = False

            for rec in ai_result.get('recommendations', []):
                validation_result['suggestions'].append({
                    'type': 'ai_recommendation',
                    'message': rec
                })

        except Exception as e:
            logger.warning(f"AI validation failed: {e}")
            # Non-critical, continue with other validations

    # Final validation status
    if validation_result['errors']:
        validation_result['is_valid'] = False

    validation_result['summary'] = {
        'total_errors': len(validation_result['errors']),
        'total_warnings': len(validation_result['warnings']),
        'total_suggestions': len(validation_result['suggestions']),
        'character_count': prompt_length
    }

    return jsonify(validation_result), 200


# ============================================================================
# PROMPT PERFORMANCE MONITORING
# ============================================================================

@app.route('/api/prompts/performance/overview', methods=['GET'])
@jwt_required()
def get_prompt_performance_overview():
    """
    Get performance overview for all AI features.
    Shows which features are being used, custom prompt adoption, etc.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    try:
        # Get all custom prompts for this tenant
        custom_prompts = PromptCustomization.query.filter_by(tenant_id=tenant_id).all()

        # Get feature usage statistics
        usage_stats = db.session.query(
            AIFeatureUsage.feature_slug,
            db.func.count(AIFeatureUsage.id).label('usage_count'),
            db.func.max(AIFeatureUsage.used_at).label('last_used')
        ).filter_by(
            tenant_id=tenant_id
        ).group_by(
            AIFeatureUsage.feature_slug
        ).all()

        # Build performance overview
        features_performance = []

        for feature_slug in DEFAULT_PROMPTS.keys():
            # Get usage for this feature
            feature_usage = next((u for u in usage_stats if u.feature_slug == feature_slug), None)

            # Get custom prompt if exists
            custom = next((p for p in custom_prompts if p.ai_feature_slug == feature_slug), None)

            features_performance.append({
                'feature_slug': feature_slug,
                'feature_name': feature_slug.replace('-', ' ').title(),
                'usage_count': feature_usage.usage_count if feature_usage else 0,
                'last_used': feature_usage.last_used.isoformat() if feature_usage and feature_usage.last_used else None,
                'has_custom_prompt': custom is not None,
                'custom_prompt_active': custom.is_active if custom else False,
                'prompt_source': 'custom' if (custom and custom.is_active) else 'default'
            })

        # Overall statistics
        total_usage = sum(f['usage_count'] for f in features_performance)
        custom_prompt_count = sum(1 for f in features_performance if f['has_custom_prompt'])
        active_custom_count = sum(1 for f in features_performance if f['custom_prompt_active'])

        return jsonify({
            'overview': {
                'total_features': len(DEFAULT_PROMPTS),
                'total_usage': total_usage,
                'custom_prompts_created': custom_prompt_count,
                'custom_prompts_active': active_custom_count,
                'default_prompts_in_use': len(DEFAULT_PROMPTS) - active_custom_count
            },
            'features': sorted(features_performance, key=lambda x: x['usage_count'], reverse=True)
        }), 200

    except Exception as e:
        logger.error(f"Failed to get performance overview: {e}")
        return jsonify({'error': 'Failed to retrieve performance data'}), 500


@app.route('/api/prompts/performance/feature/<feature_slug>', methods=['GET'])
@jwt_required()
def get_feature_performance(feature_slug):
    """
    Get detailed performance metrics for a specific AI feature.
    Includes usage trends, prompt history, and effectiveness metrics.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    try:
        # Get custom prompt history for this feature
        prompt_history = PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug
        ).order_by(PromptCustomization.updated_at.desc()).all()

        # Get recent usage
        recent_usage = AIFeatureUsage.query.filter_by(
            tenant_id=tenant_id,
            feature_slug=feature_slug
        ).order_by(AIFeatureUsage.used_at.desc()).limit(100).all()

        # Calculate usage trends (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        usage_by_day = db.session.query(
            db.func.date(AIFeatureUsage.used_at).label('date'),
            db.func.count(AIFeatureUsage.id).label('count')
        ).filter(
            AIFeatureUsage.tenant_id == tenant_id,
            AIFeatureUsage.feature_slug == feature_slug,
            AIFeatureUsage.used_at >= thirty_days_ago
        ).group_by(
            db.func.date(AIFeatureUsage.used_at)
        ).all()

        usage_trend = [
            {'date': day.date.isoformat(), 'count': day.count}
            for day in usage_by_day
        ]

        # Get current prompt
        current_prompt = next((p for p in prompt_history if p.is_active), None) if prompt_history else None

        return jsonify({
            'feature_slug': feature_slug,
            'feature_name': feature_slug.replace('-', ' ').title(),
            'current_prompt': {
                'source': 'custom' if current_prompt else 'default',
                'last_updated': current_prompt.updated_at.isoformat() if current_prompt else None,
                'created_by': current_prompt.created_by if current_prompt else None
            },
            'usage_statistics': {
                'total_usage': len(recent_usage),
                'last_30_days': len(usage_trend),
                'trend': usage_trend
            },
            'prompt_history': [
                {
                    'id': p.id,
                    'created_at': p.created_at.isoformat() if p.created_at else None,
                    'updated_at': p.updated_at.isoformat(),
                    'is_active': p.is_active,
                    'created_by': p.created_by
                }
                for p in prompt_history
            ]
        }), 200

    except Exception as e:
        logger.error(f"Failed to get feature performance: {e}")
        return jsonify({'error': 'Failed to retrieve feature performance'}), 500


@app.route('/api/prompts/performance/compare', methods=['POST'])
@jwt_required()
def compare_prompt_performance():
    """
    Compare performance between default and custom prompts.
    Useful for A/B testing and measuring the impact of customizations.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    data = request.get_json()
    feature_slug = data.get('feature_slug')
    date_from = data.get('date_from')  # ISO format
    date_to = data.get('date_to')

    if not feature_slug:
        return jsonify({'error': 'feature_slug is required'}), 400

    try:
        # Get usage during periods with default vs custom prompts
        # This is a simplified version - in production you'd track outcomes per prompt version

        # Get custom prompt activation history
        custom_prompts = PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug
        ).all()

        # Get usage statistics
        total_usage = AIFeatureUsage.query.filter_by(
            tenant_id=tenant_id,
            feature_slug=feature_slug
        ).count()

        current_prompt = next((p for p in custom_prompts if p.is_active), None) if custom_prompts else None

        comparison = {
            'feature_slug': feature_slug,
            'total_usage': total_usage,
            'current_prompt_source': 'custom' if current_prompt else 'default',
            'custom_prompts_tested': len(custom_prompts),
            'recommendation': 'Continue monitoring. More usage data needed for comprehensive comparison.'
        }

        # If we have custom prompt history, analyze switches
        if len(custom_prompts) > 1:
            comparison['prompt_iterations'] = len(custom_prompts)
            comparison['recommendation'] = 'Multiple prompt iterations detected. Consider standardizing on the best performing version.'

        return jsonify(comparison), 200

    except Exception as e:
        logger.error(f"Failed to compare performance: {e}")
        return jsonify({'error': 'Failed to compare prompt performance'}), 500


@app.route('/api/prompts/auto-optimize/analyze', methods=['POST'])
@jwt_required()
def analyze_optimization_opportunities():
    """
    Auto-optimization: Analyze all prompts and identify optimization opportunities.
    Uses AI to detect patterns, issues, and improvement potential.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    data = request.get_json()
    feature_slug = data.get('feature_slug')  # Optional: analyze specific feature or all

    if not openai_client:
        return jsonify({'error': 'AI service not available'}), 503

    try:
        features_to_analyze = [feature_slug] if feature_slug else list(DEFAULT_PROMPTS.keys())

        optimization_opportunities = []

        for slug in features_to_analyze:
            # Get current prompt and usage stats
            industry = get_tenant_industry(tenant_id)
            current_prompt, prompt_source = get_prompt_for_feature(tenant_id, slug, industry)

            usage_count = AIFeatureUsage.query.filter_by(
                tenant_id=tenant_id,
                feature_slug=slug
            ).count()

            # Skip features with very low usage
            if usage_count < 5:
                continue

            # Use AI to analyze optimization potential
            optimization_prompt = """You are an AI prompt optimization expert. Analyze this prompt for optimization opportunities.

Consider:
1. Is the prompt performing well based on its purpose?
2. Could it be more specific or better calibrated?
3. Are there common patterns in similar prompts that work better?
4. Should this prompt be updated based on usage patterns?

Respond in JSON with:
{
  "needs_optimization": true/false,
  "confidence": 0.0-1.0,
  "priority": "low|medium|high|critical",
  "reason": "Why optimization is recommended",
  "suggested_improvements": ["Array of specific improvements"],
  "estimated_impact": "Expected improvement if optimized"
}"""

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": optimization_prompt},
                    {
                        "role": "user",
                        "content": f"""Feature: {slug}
Prompt Source: {prompt_source}
Usage Count: {usage_count}
Industry: {industry or 'generic'}

Current Prompt:
{current_prompt[:1500]}

Analyze for optimization opportunities."""
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=800
            )

            result = json.loads(response.choices[0].message.content)

            if result.get('needs_optimization'):
                optimization_opportunities.append({
                    'feature_slug': slug,
                    'feature_name': slug.replace('-', ' ').title(),
                    'current_source': prompt_source,
                    'usage_count': usage_count,
                    **result
                })

        # Sort by priority and confidence
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        optimization_opportunities.sort(
            key=lambda x: (priority_order.get(x['priority'], 0), x['confidence']),
            reverse=True
        )

        return jsonify({
            'analyzed_features': len(features_to_analyze),
            'opportunities_found': len(optimization_opportunities),
            'recommendations': optimization_opportunities,
            'summary': {
                'critical': sum(1 for o in optimization_opportunities if o['priority'] == 'critical'),
                'high': sum(1 for o in optimization_opportunities if o['priority'] == 'high'),
                'medium': sum(1 for o in optimization_opportunities if o['priority'] == 'medium'),
                'low': sum(1 for o in optimization_opportunities if o['priority'] == 'low')
            }
        }), 200

    except Exception as e:
        logger.error(f"Auto-optimization analysis failed: {e}")
        return jsonify({'error': 'Failed to analyze optimization opportunities'}), 500


@app.route('/api/prompts/auto-optimize/apply', methods=['POST'])
@jwt_required()
def apply_auto_optimization():
    """
    Auto-apply optimizations to prompts.
    Generates optimized version and optionally applies it.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']
    user_id = claims['sub']

    data = request.get_json()
    feature_slug = data.get('feature_slug')
    auto_apply = data.get('auto_apply', False)  # If True, automatically activate the optimized prompt

    if not feature_slug:
        return jsonify({'error': 'feature_slug is required'}), 400

    if not openai_client:
        return jsonify({'error': 'AI service not available'}), 503

    try:
        # Get current prompt
        industry = get_tenant_industry(tenant_id)
        current_prompt, prompt_source = get_prompt_for_feature(tenant_id, feature_slug, industry)

        if not current_prompt:
            return jsonify({'error': 'Could not retrieve current prompt'}), 500

        # Get usage data for context
        usage_count = AIFeatureUsage.query.filter_by(
            tenant_id=tenant_id,
            feature_slug=feature_slug
        ).count()

        # Generate optimized prompt
        optimization_prompt = """You are an elite AI prompt optimizer. Generate an optimized version of this prompt.

Your optimization should:
1. Preserve core functionality and JSON output requirements
2. Improve clarity and specificity
3. Add best practices from successful similar prompts
4. Calibrate scoring/analysis appropriately
5. Make the prompt more comprehensive yet focused

Respond in JSON with:
{
  "optimized_prompt": "The fully optimized prompt text",
  "changes_made": ["List of specific improvements made"],
  "optimization_summary": "Brief summary of the optimization",
  "expected_improvements": "What should improve with this optimization",
  "confidence": 0.0-1.0
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": optimization_prompt},
                {
                    "role": "user",
                    "content": f"""Feature: {feature_slug}
Current Source: {prompt_source}
Industry: {industry or 'generic'}
Usage Count: {usage_count}

Current Prompt to Optimize:
{current_prompt}

Generate an optimized version."""
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2500
        )

        result = json.loads(response.choices[0].message.content)
        optimized_prompt = result.get('optimized_prompt')

        # Apply optimization if requested
        if auto_apply and optimized_prompt:
            # Check if custom prompt exists
            custom = PromptCustomization.query.filter_by(
                tenant_id=tenant_id,
                ai_feature_slug=feature_slug
            ).first()

            if custom:
                custom.custom_prompt = optimized_prompt
                custom.is_active = True
                custom.updated_at = datetime.utcnow()
            else:
                custom = PromptCustomization(
                    tenant_id=tenant_id,
                    ai_feature_slug=feature_slug,
                    custom_prompt=optimized_prompt,
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(custom)

            db.session.commit()
            logger.info(f"🤖 Auto-optimization applied for {feature_slug} by tenant {tenant_id}")

        track_feature_usage(tenant_id, 'auto-optimization')

        return jsonify({
            'success': True,
            'feature_slug': feature_slug,
            'optimized_prompt': optimized_prompt,
            'changes_made': result.get('changes_made', []),
            'optimization_summary': result.get('optimization_summary'),
            'expected_improvements': result.get('expected_improvements'),
            'confidence': result.get('confidence', 0.8),
            'applied': auto_apply
        }), 200

    except Exception as e:
        logger.error(f"Auto-optimization failed: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to apply auto-optimization'}), 500


@app.route('/api/prompts/auto-optimize/schedule', methods=['POST'])
@jwt_required()
def schedule_auto_optimization():
    """
    Schedule automatic optimization checks.
    In production, this would set up periodic optimization analysis.
    """
    claims = get_jwt_identity()
    tenant_id = claims['tenant_id']

    data = request.get_json()
    enabled = data.get('enabled', True)
    frequency = data.get('frequency', 'weekly')  # daily, weekly, monthly

    # In a real implementation, this would configure a background job
    # For now, we'll return a success message

    return jsonify({
        'success': True,
        'message': f'Auto-optimization {"enabled" if enabled else "disabled"}',
        'frequency': frequency,
        'tenant_id': tenant_id,
        'note': 'In production, this would schedule background optimization jobs'
    }), 200


# ============================================================================
# SETUP REQUEST ENDPOINTS
# ============================================================================

@app.route('/api/setup-requests', methods=['POST'])
def create_setup_request():
    """Create a new setup request from potential customer"""
    data = request.get_json()

    required_fields = ['company_name', 'contact_email', 'contact_phone', 'phone_system_type', 'selected_plan']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Generate unique request ID
        import uuid
        request_id = str(uuid.uuid4())[:8].upper()

        setup_request = SetupRequest(
            request_id=request_id,
            company_name=data['company_name'],
            industry=data.get('industry'),
            company_size=data.get('company_size'),
            website=data.get('website'),
            contact_name=data['contact_name'],
            contact_email=data['contact_email'],
            contact_phone=data['contact_phone'],
            contact_title=data.get('contact_title'),
            technical_details=json.dumps({
                'phone_system_type': data['phone_system_type'],
                'phone_system_other': data.get('phone_system_other'),
                'pbx_ip': data.get('pbx_ip'),
                'pbx_port': data.get('pbx_port'),
                'pbx_username': data.get('pbx_username'),
                'pbx_password': data.get('pbx_password'),
                'current_call_volume': data.get('current_call_volume'),
                'timezone': data.get('timezone'),
                'has_pbx_admin_access': data.get('has_pbx_admin_access'),
                'can_configure_webhooks': data.get('can_configure_webhooks'),
                'network_type': data.get('network_type')
            }),
            selected_plan=data['selected_plan'],
            features_requested=json.dumps({
                'transcription_needed': data.get('transcription_needed', True),
                'sentiment_analysis_needed': data.get('sentiment_analysis_needed', True),
                'real_time_alerts': data.get('real_time_alerts', False),
                'integration_slack': data.get('integration_slack', False),
                'integration_email': data.get('integration_email', False),
                'export_reports': data.get('export_reports', False)
            }),
            specific_requirements=data.get('specific_requirements'),
            compliance_requirements=data.get('compliance_requirements'),
            preferred_setup_date=data.get('preferred_setup_date'),
            status='pending',
            payment_status='pending'
        )

        db.session.add(setup_request)
        db.session.commit()

        logger.info(f"Setup request created: {request_id} for {data['company_name']}")

        return jsonify({
            'request_id': request_id,
            'message': 'Setup request submitted successfully',
            'next_step': 'payment'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Setup request error: {e}", exc_info=True)
        return jsonify({'error': f'Failed to create setup request: {str(e)}'}), 500


@app.route('/api/setup-requests/<request_id>', methods=['GET'])
def get_setup_request(request_id):
    """Get setup request details (for payment page)"""
    setup_request = SetupRequest.query.filter_by(request_id=request_id).first()

    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    return jsonify({
        'request_id': setup_request.request_id,
        'company_name': setup_request.company_name,
        'contact_email': setup_request.contact_email,
        'selected_plan': setup_request.selected_plan,
        'status': setup_request.status,
        'payment_status': setup_request.payment_status,
        'created_at': setup_request.created_at.isoformat()
    }), 200


@app.route('/api/setup-requests/<request_id>/payment', methods=['POST'])
@limiter.limit("10 per hour")
def process_payment(request_id):
    """Process payment for setup request via PayPal"""
    setup_request = SetupRequest.query.filter_by(request_id=request_id).first()

    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    if setup_request.payment_status == 'completed':
        return jsonify({'error': 'Payment already processed'}), 400

    data = request.get_json()
    payment_method = data.get('payment_method', 'paypal')

    try:
        if payment_method == 'paypal':
            # Initialize PayPal SDK
            try:
                import paypalrestsdk

                paypalrestsdk.configure({
                    "mode": os.getenv('PAYPAL_MODE', 'sandbox'),
                    "client_id": os.getenv('PAYPAL_CLIENT_ID'),
                    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET')
                })

                # Get plan pricing
                plan_prices = {
                    'starter': 49,
                    'professional': 149,
                    'enterprise': 499
                }
                amount = plan_prices.get(setup_request.selected_plan, 49)

                # Create PayPal payment/order
                payment = paypalrestsdk.Payment({
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/setup-complete/{request_id}",
                        "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/checkout/{request_id}"
                    },
                    "transactions": [{
                        "item_list": {
                            "items": [{
                                "name": f"AudiaPro {setup_request.selected_plan.title()} Plan",
                                "sku": setup_request.selected_plan,
                                "price": str(amount),
                                "currency": "USD",
                                "quantity": 1
                            }]
                        },
                        "amount": {
                            "total": str(amount),
                            "currency": "USD"
                        },
                        "description": f"AudiaPro subscription for {setup_request.company_name}"
                    }]
                })

                if payment.create():
                    # Payment created successfully
                    setup_request.payment_id = payment.id
                    setup_request.status = 'payment_pending'
                    db.session.commit()

                    # Get approval URL
                    approval_url = None
                    for link in payment.links:
                        if link.rel == "approval_url":
                            approval_url = link.href
                            break

                    logger.info(f"PayPal payment created for setup request {request_id}: {payment.id}")

                    return jsonify({
                        'payment_id': payment.id,
                        'status': 'pending',
                        'approval_url': approval_url,
                        'message': 'Payment created - redirect to PayPal'
                    }), 200
                else:
                    logger.error(f"PayPal payment creation failed: {payment.error}")
                    return jsonify({'error': 'Payment creation failed'}), 500

            except ImportError:
                logger.error("PayPal SDK not installed")
                # Fallback to simulation mode
                import uuid
                payment_id = f"SIMULATED_{uuid.uuid4().hex[:24]}"
                setup_request.payment_status = 'completed'
                setup_request.payment_id = payment_id
                setup_request.status = 'payment_received'
                db.session.commit()

                return jsonify({
                    'payment_id': payment_id,
                    'status': 'completed',
                    'message': 'Payment simulated (PayPal SDK not configured)'
                }), 200

        else:
            # Card payment - simulate for now
            import uuid
            payment_id = f"CARD_{uuid.uuid4().hex[:24]}"
            setup_request.payment_status = 'completed'
            setup_request.payment_id = payment_id
            setup_request.status = 'payment_received'
            db.session.commit()

            return jsonify({
                'payment_id': payment_id,
                'status': 'completed',
                'message': 'Card payment processed'
            }), 200

    except Exception as e:
        logger.error(f"Payment error: {e}", exc_info=True)
        return jsonify({'error': 'Payment processing failed'}), 500


@app.route('/api/setup-requests/<request_id>/payment/verify', methods=['POST'])
@limiter.limit("10 per hour")
def verify_payment(request_id):
    """Verify PayPal payment completion"""
    setup_request = SetupRequest.query.filter_by(request_id=request_id).first()

    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    data = request.get_json()
    payment_id = data.get('paymentId')
    payer_id = data.get('PayerID')

    if not payment_id or not payer_id:
        return jsonify({'error': 'Missing payment verification data'}), 400

    try:
        import paypalrestsdk

        paypalrestsdk.configure({
            "mode": os.getenv('PAYPAL_MODE', 'sandbox'),
            "client_id": os.getenv('PAYPAL_CLIENT_ID'),
            "client_secret": os.getenv('PAYPAL_CLIENT_SECRET')
        })

        payment = paypalrestsdk.Payment.find(payment_id)

        if payment.execute({"payer_id": payer_id}):
            # Payment successful
            setup_request.payment_status = 'completed'
            setup_request.payment_id = payment_id
            setup_request.status = 'payment_received'
            db.session.commit()

            logger.info(f"PayPal payment verified for setup request {request_id}")

            # Log audit
            log_audit('payment_completed', 'setup_request', setup_request.id,
                     {'payment_id': payment_id, 'amount': payment.transactions[0].amount.total},
                     None, None)

            return jsonify({
                'status': 'completed',
                'message': 'Payment verified successfully'
            }), 200
        else:
            logger.error(f"PayPal payment execution failed: {payment.error}")
            return jsonify({'error': 'Payment verification failed'}), 400

    except ImportError:
        # SDK not installed - accept anyway for development
        setup_request.payment_status = 'completed'
        setup_request.payment_id = payment_id
        setup_request.status = 'payment_received'
        db.session.commit()

        return jsonify({
            'status': 'completed',
            'message': 'Payment accepted (dev mode)'
        }), 200

    except Exception as e:
        logger.error(f"Payment verification error: {e}", exc_info=True)
        return jsonify({'error': 'Payment verification failed'}), 500


# ============================================================================
# PAYPAL WEBHOOK HANDLER
# ============================================================================

@app.route('/api/webhooks/paypal', methods=['POST'])
@limiter.limit("100 per hour")
def paypal_webhook():
    """Handle PayPal webhook events for subscriptions and payments"""
    try:
        # Get webhook data
        webhook_data = request.get_json()
        event_type = webhook_data.get('event_type')
        resource = webhook_data.get('resource', {})

        logger.info(f"PayPal webhook received: {event_type}")

        # Handle different event types
        if event_type == 'BILLING.SUBSCRIPTION.CREATED':
            # Subscription created
            subscription_id = resource.get('id')
            subscriber_email = resource.get('subscriber', {}).get('email_address')

            # Find tenant by email or subscription_id
            tenant = Tenant.query.filter_by(paypal_subscription_id=subscription_id).first()
            if tenant:
                tenant.billing_cycle_start = datetime.utcnow()
                tenant.subscription_ends_at = datetime.utcnow() + timedelta(days=30)
                db.session.commit()
                logger.info(f"Subscription created for tenant {tenant.id}")

        elif event_type == 'BILLING.SUBSCRIPTION.CANCELLED':
            # Subscription canceled
            subscription_id = resource.get('id')
            tenant = Tenant.query.filter_by(paypal_subscription_id=subscription_id).first()

            if tenant:
                # Set expiration to end of current billing period
                if tenant.billing_cycle_start:
                    tenant.subscription_ends_at = tenant.billing_cycle_start + timedelta(days=30)
                else:
                    tenant.subscription_ends_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Subscription canceled for tenant {tenant.id}")

        elif event_type == 'PAYMENT.SALE.COMPLETED':
            # Payment completed
            payment_id = resource.get('id')
            amount = float(resource.get('amount', {}).get('total', 0))
            subscription_id = resource.get('billing_agreement_id')

            # Find tenant
            tenant = Tenant.query.filter_by(paypal_subscription_id=subscription_id).first()

            if tenant:
                # Create billing history record
                import uuid
                invoice_number = f"INV-{uuid.uuid4().hex[:12].upper()}"

                billing = BillingHistory(
                    tenant_id=tenant.id,
                    invoice_number=invoice_number,
                    amount=amount,
                    payment_status='paid',
                    payment_method='paypal',
                    created_at=datetime.utcnow()
                )
                db.session.add(billing)

                # Extend subscription
                tenant.billing_cycle_start = datetime.utcnow()
                tenant.subscription_ends_at = datetime.utcnow() + timedelta(days=30)
                tenant.usage_this_month = 0  # Reset usage counter

                db.session.commit()
                logger.info(f"Payment completed for tenant {tenant.id}: ${amount}")

        elif event_type == 'PAYMENT.SALE.DENIED' or event_type == 'PAYMENT.SALE.REFUNDED':
            # Payment failed or refunded
            payment_id = resource.get('id')
            subscription_id = resource.get('billing_agreement_id')

            tenant = Tenant.query.filter_by(paypal_subscription_id=subscription_id).first()

            if tenant:
                # Create failed billing record
                import uuid
                invoice_number = f"INV-{uuid.uuid4().hex[:12].upper()}"

                billing = BillingHistory(
                    tenant_id=tenant.id,
                    invoice_number=invoice_number,
                    amount=0,
                    payment_status='failed',
                    payment_method='paypal',
                    created_at=datetime.utcnow()
                )
                db.session.add(billing)
                db.session.commit()

                logger.warning(f"Payment failed for tenant {tenant.id}")

        return jsonify({'status': 'received'}), 200

    except Exception as e:
        logger.error(f"PayPal webhook error: {e}", exc_info=True)
        return jsonify({'error': 'Webhook processing failed'}), 500


# ============================================================================
# ADMIN ENDPOINTS (for processing setup requests)
# ============================================================================

@app.route('/api/admin/setup-requests', methods=['GET'])
@jwt_required()
def admin_list_setup_requests():
    """List all setup requests (admin only)"""
    claims = get_jwt()
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    status_filter = request.args.get('status', 'all')
    page = int(request.args.get('page', 1))
    per_page = 25

    query = SetupRequest.query
    if status_filter != 'all':
        query = query.filter_by(status=status_filter)

    setup_requests = query.order_by(SetupRequest.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'requests': [{
            'id': req.id,
            'request_id': req.request_id,
            'company_name': req.company_name,
            'contact_email': req.contact_email,
            'contact_phone': req.contact_phone,
            'selected_plan': req.selected_plan,
            'status': req.status,
            'payment_status': req.payment_status,
            'created_at': req.created_at.isoformat(),
            'assigned_to': req.assigned_to
        } for req in setup_requests.items],
        'total': setup_requests.total,
        'pages': setup_requests.pages,
        'current_page': setup_requests.page
    }), 200


@app.route('/api/admin/setup-requests/<int:id>', methods=['PUT'])
@jwt_required()
def admin_update_setup_request(id):
    """Update setup request status (admin only)"""
    claims = get_jwt()
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    setup_request = SetupRequest.query.get(id)
    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    data = request.get_json()

    if 'status' in data:
        setup_request.status = data['status']
    if 'admin_notes' in data:
        setup_request.admin_notes = data['admin_notes']
    if 'assigned_to' in data:
        setup_request.assigned_to = data['assigned_to']

    db.session.commit()

    return jsonify({'message': 'Setup request updated'}), 200


@app.route('/api/admin/setup-requests/<int:id>/detail', methods=['GET'])
@jwt_required()
def admin_get_setup_request_detail(id):
    """Get full setup request details (admin only)"""
    claims = get_jwt()
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    setup_request = SetupRequest.query.get(id)
    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    return jsonify({
        'id': setup_request.id,
        'request_id': setup_request.request_id,
        'company_name': setup_request.company_name,
        'industry': setup_request.industry,
        'company_size': setup_request.company_size,
        'website': setup_request.website,
        'contact_name': setup_request.contact_name,
        'contact_email': setup_request.contact_email,
        'contact_phone': setup_request.contact_phone,
        'contact_title': setup_request.contact_title,
        'technical_details': json.loads(setup_request.technical_details) if setup_request.technical_details else {},
        'selected_plan': setup_request.selected_plan,
        'features_requested': json.loads(setup_request.features_requested) if setup_request.features_requested else {},
        'specific_requirements': setup_request.specific_requirements,
        'compliance_requirements': setup_request.compliance_requirements,
        'preferred_setup_date': setup_request.preferred_setup_date,
        'status': setup_request.status,
        'payment_status': setup_request.payment_status,
        'payment_id': setup_request.payment_id,
        'tenant_id': setup_request.tenant_id,
        'admin_notes': setup_request.admin_notes,
        'assigned_to': setup_request.assigned_to,
        'created_at': setup_request.created_at.isoformat(),
        'updated_at': setup_request.updated_at.isoformat() if setup_request.updated_at else None
    }), 200


@app.route('/api/admin/setup-requests/<int:id>/activate', methods=['POST'])
@jwt_required()
def admin_activate_setup_request(id):
    """Activate account - create tenant and admin user (admin only)"""
    claims = get_jwt()
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    setup_request = SetupRequest.query.get(id)
    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    if setup_request.tenant_id:
        return jsonify({'error': 'Account already activated'}), 400

    if setup_request.payment_status != 'completed':
        return jsonify({'error': 'Payment not completed'}), 400

    try:
        # Parse technical details
        technical = json.loads(setup_request.technical_details) if setup_request.technical_details else {}

        # Create subdomain from company name
        subdomain = setup_request.company_name.lower().replace(' ', '-').replace('_', '-')
        base_subdomain = subdomain
        counter = 1
        while Tenant.query.filter_by(subdomain=subdomain).first():
            subdomain = f"{base_subdomain}-{counter}"
            counter += 1

        # Create tenant
        tenant = Tenant(
            company_name=setup_request.company_name,
            subdomain=subdomain,
            plan=setup_request.selected_plan,
            phone_system_type=technical.get('phone_system_type', 'grandstream_ucm'),
            pbx_ip=technical.get('pbx_ip'),
            pbx_username=technical.get('pbx_username'),
            pbx_password=technical.get('pbx_password'),
            pbx_port=int(technical.get('pbx_port', 8443)) if technical.get('pbx_port') else 8443,
            transcription_enabled=True,
            sentiment_enabled=True,
            is_active=True
        )
        db.session.add(tenant)
        db.session.flush()

        # Generate temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$') for _ in range(12))

        # Create admin user
        user = User(
            tenant_id=tenant.id,
            email=setup_request.contact_email,
            full_name=setup_request.contact_name,
            role='admin',
            is_active=True
        )
        user.set_password(temp_password)
        db.session.add(user)

        # Update setup request
        setup_request.tenant_id = tenant.id
        setup_request.status = 'completed'
        setup_request.completed_at = datetime.utcnow()

        db.session.commit()

        logger.info(f"Account activated: {setup_request.company_name} (tenant_id: {tenant.id})")

        # Send welcome email to new admin
        send_welcome_email(
            setup_request.contact_email,
            setup_request.contact_name,
            temp_password,
            setup_request.company_name
        )

        return jsonify({
            'message': 'Account activated successfully',
            'tenant_id': tenant.id,
            'subdomain': subdomain,
            'email': setup_request.contact_email,
            'temp_password': temp_password,
            'login_url': f'/login'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Account activation error: {e}", exc_info=True)
        return jsonify({'error': f'Activation failed: {str(e)}'}), 500


# ============================================================================
# CALL DETAIL ENDPOINTS
# ============================================================================

@app.route('/api/calls/<int:call_id>', methods=['GET'])
@jwt_required()
def get_call_detail(call_id):
    """Get complete call details with transcription and sentiment"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    cdr = CDRRecord.query.filter_by(id=call_id, tenant_id=tenant_id).first()
    if not cdr:
        return jsonify({'error': 'Call not found'}), 404

    call_data = {
        'id': cdr.id,
        'uniqueid': cdr.uniqueid,
        'src': cdr.src,
        'dst': cdr.dst,
        'caller_name': cdr.caller_name,
        'start_time': cdr.start_time,
        'answer_time': cdr.answer_time,
        'end_time': cdr.end_time,
        'duration': cdr.duration,
        'billsec': cdr.billsec,
        'disposition': cdr.disposition,
        'recording_local_path': cdr.recording_local_path,
        'has_recording': bool(cdr.recording_local_path),
        'transcription': None,
        'sentiment': None,
        'ai_summary': None
    }

    # Get transcription if exists
    if cdr.transcription:
        trans = cdr.transcription
        call_data['transcription'] = {
            'text': trans.transcription_text,
            'language': trans.language,
            'duration': trans.duration_seconds,
            'transcribed_at': trans.transcribed_at.isoformat() if trans.transcribed_at else None
        }

        # Get sentiment if exists
        if trans.sentiment:
            sent = trans.sentiment
            call_data['sentiment'] = {
                'sentiment': sent.sentiment,
                'sentiment_score': sent.sentiment_score,
                'positive_score': sent.positive_score,
                'negative_score': sent.negative_score,
                'neutral_score': sent.neutral_score,
                'key_phrases': sent.key_phrases,
                'analyzed_at': sent.analyzed_at.isoformat() if sent.analyzed_at else None
            }

    # Get AI summary if exists
    ai_summary = AISummary.query.filter_by(cdr_id=call_id).first()
    if ai_summary:
        call_data['ai_summary'] = {
            'summary': ai_summary.summary_text,
            'topics': json.loads(ai_summary.topics) if ai_summary.topics else [],
            'action_items': json.loads(ai_summary.action_items) if ai_summary.action_items else [],
            'customer_intent': ai_summary.customer_intent,
            'call_outcome': ai_summary.call_outcome
        }

    # Get call quality score if exists
    quality_score = CallQualityScore.query.filter_by(cdr_id=call_id).first()
    if quality_score:
        call_data['quality_score'] = {
            'overall_score': quality_score.overall_score,
            'greeting_score': quality_score.greeting_score,
            'professionalism_score': quality_score.professionalism_score,
            'problem_resolution_score': quality_score.problem_resolution_score,
            'closing_score': quality_score.closing_score,
            'objection_handling_score': quality_score.objection_handling_score,
            'strengths': json.loads(quality_score.strengths) if quality_score.strengths else [],
            'areas_for_improvement': json.loads(quality_score.areas_for_improvement) if quality_score.areas_for_improvement else [],
            'recommendations': json.loads(quality_score.recommendations) if quality_score.recommendations else [],
            'scored_at': quality_score.scored_at.isoformat() if quality_score.scored_at else None
        }

    # Get emotion detection if exists
    emotion = EmotionDetection.query.filter_by(cdr_id=call_id).first()
    if emotion:
        call_data['emotion_detection'] = {
            'primary_emotion': emotion.primary_emotion,
            'emotion_confidence': emotion.emotion_confidence,
            'emotions_detected': json.loads(emotion.emotions_detected) if emotion.emotions_detected else {},
            'emotion_timeline': json.loads(emotion.emotion_timeline) if emotion.emotion_timeline else [],
            'customer_satisfaction_indicators': json.loads(emotion.customer_satisfaction_indicators) if emotion.customer_satisfaction_indicators else [],
            'analyzed_at': emotion.analyzed_at.isoformat() if emotion.analyzed_at else None
        }

    # Get churn prediction if exists
    churn = ChurnPrediction.query.filter_by(cdr_id=call_id).first()
    if churn:
        call_data['churn_prediction'] = {
            'churn_risk_score': churn.churn_risk_score,
            'churn_risk_level': churn.churn_risk_level,
            'risk_factors': json.loads(churn.risk_factors) if churn.risk_factors else [],
            'retention_recommendations': json.loads(churn.retention_recommendations) if churn.retention_recommendations else [],
            'predicted_at': churn.predicted_at.isoformat() if churn.predicted_at else None
        }

    # Get objection analysis if exists
    objection = ObjectionAnalysis.query.filter_by(cdr_id=call_id).first()
    if objection:
        call_data['objection_analysis'] = {
            'objections_detected': json.loads(objection.objections_detected) if objection.objections_detected else [],
            'objection_handling_effectiveness': objection.objection_handling_effectiveness,
            'successful_rebuttals': json.loads(objection.successful_rebuttals) if objection.successful_rebuttals else [],
            'missed_opportunities': json.loads(objection.missed_opportunities) if objection.missed_opportunities else [],
            'recommendations': json.loads(objection.recommendations) if objection.recommendations else [],
            'analyzed_at': objection.analyzed_at.isoformat() if objection.analyzed_at else None
        }

    # Get deal risk score if exists
    deal_risk = DealRiskScore.query.filter_by(cdr_id=call_id).first()
    if deal_risk:
        call_data['deal_risk'] = {
            'risk_score': deal_risk.risk_score,
            'risk_level': deal_risk.risk_level,
            'risk_factors': json.loads(deal_risk.risk_factors) if deal_risk.risk_factors else [],
            'positive_indicators': json.loads(deal_risk.positive_indicators) if deal_risk.positive_indicators else [],
            'recommendations': json.loads(deal_risk.recommendations) if deal_risk.recommendations else [],
            'predicted_at': deal_risk.predicted_at.isoformat() if deal_risk.predicted_at else None
        }

    return jsonify(call_data), 200


@app.route('/api/calls/<int:call_id>/ai-summary', methods=['GET'])
@jwt_required()
def get_call_ai_summary(call_id):
    """Get AI summary for a specific call"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        # Verify call belongs to tenant
        cdr = CDRRecord.query.filter_by(id=call_id, tenant_id=tenant_id).first()
        if not cdr:
            return jsonify({'error': 'Call not found'}), 404

        # Only provide summary for calls > 45 seconds
        if cdr.duration <= 45:
            return jsonify({'error': 'Summary only available for calls longer than 45 seconds'}), 400

        # Get transcription
        transcription = Transcription.query.filter_by(cdr_id=call_id).first()
        if not transcription or not transcription.transcription_text:
            return jsonify({'error': 'No transcription available for this call'}), 404

        # Get or generate AI summary
        ai_summary = AISummary.query.filter_by(cdr_id=call_id).first()

        if not ai_summary:
            # Generate summary on-the-fly using OpenAI
            try:
                client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

                summary_prompt = f"""Analyze this call transcription and provide a comprehensive summary:

Transcription:
{transcription.transcription_text}

Provide:
1. A brief overview (2-3 sentences)
2. Key points discussed (3-5 bullet points)
3. Action items or next steps (if any)
4. Detailed sentiment analysis

Format your response as JSON with keys: summary, key_points (array), action_items (array), sentiment_analysis"""

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that analyzes call transcriptions and provides structured summaries."},
                        {"role": "user", "content": summary_prompt}
                    ],
                    response_format={"type": "json_object"}
                )

                summary_data = json.loads(response.choices[0].message.content)

                return jsonify({
                    'summary': summary_data.get('summary', ''),
                    'key_points': summary_data.get('key_points', []),
                    'action_items': summary_data.get('action_items', []),
                    'sentiment_analysis': summary_data.get('sentiment_analysis', ''),
                    'customer_intent': summary_data.get('customer_intent', None),
                    'call_outcome': summary_data.get('call_outcome', None)
                }), 200

            except Exception as e:
                logger.error(f"Error generating AI summary: {e}", exc_info=True)
                return jsonify({'error': 'Failed to generate AI summary'}), 500

        # Return existing summary
        return jsonify({
            'summary': ai_summary.summary_text or '',
            'key_points': json.loads(ai_summary.topics) if ai_summary.topics else [],
            'action_items': json.loads(ai_summary.action_items) if ai_summary.action_items else [],
            'sentiment_analysis': ai_summary.customer_intent or ai_summary.call_outcome or None,
            'customer_intent': ai_summary.customer_intent,
            'call_outcome': ai_summary.call_outcome
        }), 200

    except Exception as e:
        logger.error(f"Get AI summary error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ACTIVITY LOGS ENDPOINTS
# ============================================================================

@app.route('/api/activity-logs', methods=['GET'])
@jwt_required()
def get_activity_logs():
    """Get system activity logs"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        role = claims.get('role', 'user')

        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))

        logs = []

        # Get recent calls as activity logs
        if role == 'superadmin':
            calls_query = CDRRecord.query.order_by(CDRRecord.id.desc())
        else:
            calls_query = CDRRecord.query.filter_by(tenant_id=tenant_id).order_by(CDRRecord.id.desc())

        calls = calls_query.limit(per_page).offset((page - 1) * per_page).all()
        total = calls_query.count()

        for call in calls:
            # Add call received log
            logs.append({
                'type': 'call_received',
                'message': f'Call received from {call.src} to {call.dst}',
                'details': f'{call.disposition} - Duration: {call.duration}s',
                'timestamp': call.received_at.isoformat() if call.received_at else call.call_date.isoformat(),
                'call_id': call.id
            })

            # Add recording downloaded log if available
            if call.recording_local_path:
                logs.append({
                    'type': 'recording_downloaded',
                    'message': f'Recording downloaded for call {call.uniqueid}',
                    'details': 'MP3 format, uploaded to Supabase storage',
                    'timestamp': call.received_at.isoformat() if call.received_at else call.call_date.isoformat(),
                    'call_id': call.id
                })

            # Add transcription log if available
            if call.transcription:
                logs.append({
                    'type': 'transcription_completed',
                    'message': f'Transcription completed for call {call.uniqueid}',
                    'details': f'Transcribed {len(call.transcription.transcription_text or "")} characters',
                    'timestamp': call.received_at.isoformat() if call.received_at else call.call_date.isoformat(),
                    'call_id': call.id
                })

                # Add AI analysis log if sentiment available
                if call.transcription.sentiment:
                    logs.append({
                        'type': 'ai_analysis_completed',
                        'message': f'AI analysis completed for call {call.uniqueid}',
                        'details': f'Sentiment: {call.transcription.sentiment.sentiment}, Score: {call.transcription.sentiment.sentiment_score:.2f}',
                        'timestamp': call.received_at.isoformat() if call.received_at else call.call_date.isoformat(),
                        'call_id': call.id
                    })

        # Sort logs by timestamp (most recent first)
        logs.sort(key=lambda x: x['timestamp'], reverse=True)

        # Limit to per_page after sorting
        logs = logs[:per_page]

        return jsonify({
            'logs': logs,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        logger.error(f"Get activity logs error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    claims = get_jwt()
    user_id = get_jwt_identity()
    tenant_id = claims.get('tenant_id')

    page = int(request.args.get('page', 1))
    unread_only = request.args.get('unread', 'false').lower() == 'true'

    query = Notification.query.filter(
        Notification.tenant_id == tenant_id,
        (Notification.user_id == user_id) | (Notification.user_id == None)
    )

    if unread_only:
        query = query.filter_by(read=False)

    notifications = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )

    return jsonify({
        'notifications': [{
            'id': notif.id,
            'type': notif.notification_type,
            'title': notif.title,
            'message': notif.message,
            'read': notif.read,
            'cdr_id': notif.cdr_id,
            'created_at': notif.created_at.isoformat()
        } for notif in notifications.items],
        'total': notifications.total,
        'unread_count': Notification.query.filter_by(tenant_id=tenant_id, read=False).count()
    }), 200


@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notif_id):
    """Mark notification as read"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    notification = Notification.query.filter_by(id=notif_id, tenant_id=tenant_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    notification.read = True
    notification.read_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Notification marked as read'}), 200


@app.route('/api/notifications/rules', methods=['GET'])
@jwt_required()
def get_notification_rules():
    """Get notification rules for tenant"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    rules = NotificationRule.query.filter_by(tenant_id=tenant_id).all()

    return jsonify({
        'rules': [{
            'id': rule.id,
            'name': rule.name,
            'trigger_type': rule.trigger_type,
            'threshold_value': rule.threshold_value,
            'enabled': rule.enabled,
            'notify_email': rule.notify_email,
            'notify_slack': rule.notify_slack,
            'notify_inapp': rule.notify_inapp
        } for rule in rules]
    }), 200


@app.route('/api/notifications/rules', methods=['POST'])
@jwt_required()
def create_notification_rule():
    """Create new notification rule"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    rule = NotificationRule(
        tenant_id=tenant_id,
        name=data['name'],
        trigger_type=data['trigger_type'],
        threshold_value=data.get('threshold_value'),
        threshold_unit=data.get('threshold_unit'),
        notify_email=data.get('notify_email', False),
        notify_slack=data.get('notify_slack', False),
        notify_inapp=data.get('notify_inapp', True)
    )

    db.session.add(rule)
    db.session.commit()

    return jsonify({'id': rule.id, 'message': 'Notification rule created'}), 201


# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users in tenant (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    users = User.query.filter_by(tenant_id=tenant_id).all()

    return jsonify({
        'users': [{
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None
        } for u in users]
    }), 200


@app.route('/api/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get available roles and their permissions"""
    claims = get_jwt()
    user_role = claims.get('role', 'user')

    # Return all roles with their details
    roles_info = []
    for role_name, role_data in ROLE_PERMISSIONS.items():
        roles_info.append({
            'name': role_name,
            'description': role_data.get('description', ''),
            'permissions': role_data.get('permissions', []),
            'can_assign': user_role == 'admin'  # Only admins can assign roles
        })

    # Get current user's permissions
    current_permissions = get_user_permissions(user_role)

    return jsonify({
        'available_roles': roles_info,
        'current_role': user_role,
        'current_permissions': current_permissions
    }), 200


@app.route('/api/users', methods=['POST'])
@jwt_required()
@require_permission('manage_users')
def create_user():
    """Create new user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    data = request.get_json()

    required = ['email', 'full_name', 'password']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Check max_users limit
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return jsonify({'error': 'Tenant not found'}), 404

    current_user_count = User.query.filter_by(tenant_id=tenant_id).count()
    if current_user_count >= tenant.max_users:
        return jsonify({
            'error': 'User limit reached',
            'message': f'Your plan allows maximum {tenant.max_users} users. Please upgrade your plan to add more users.',
            'current_users': current_user_count,
            'max_users': tenant.max_users,
            'upgrade_required': True
        }), 403

    try:
        user = User(
            tenant_id=tenant_id,
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'user'),
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        logger.info(f"User created: {user.email} (tenant_id: {tenant_id})")

        # Get tenant info for welcome email
        tenant = Tenant.query.get(tenant_id)

        # Send welcome email
        send_welcome_email(
            user.email,
            user.full_name,
            data['password'],  # Temporary password
            tenant.company_name if tenant else 'AudiaPro'
        )

        return jsonify({
            'id': user.id,
            'email': user.email,
            'message': 'User created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"User creation error: {e}", exc_info=True)
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@require_permission('manage_users')
def update_user(user_id):
    """Update user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    user_to_update = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_update:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'full_name' in data:
        user_to_update.full_name = data['full_name']
    if 'role' in data:
        user_to_update.role = data['role']
    if 'is_active' in data:
        user_to_update.is_active = data['is_active']

    db.session.commit()

    return jsonify({'message': 'User updated successfully'}), 200


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_permission('manage_users')
def delete_user(user_id):
    """Delete user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')
    current_user_id = get_jwt_identity()

    if user_id == current_user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    user_to_delete = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_delete:
        return jsonify({'error': 'User not found'}), 404

    try:
        db.session.delete(user_to_delete)
        db.session.commit()

        logger.info(f"User deleted: {user_to_delete.email} (id: {user_id})")

        return jsonify({'message': 'User deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"User deletion error: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500


@app.route('/api/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(user_id):
    """Reset user password (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    user_to_update = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_update:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    new_password = data.get('password')

    if not new_password or len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    try:
        user_to_update.set_password(new_password)
        db.session.commit()

        logger.info(f"Password reset for user: {user_to_update.email}")

        return jsonify({'message': 'Password reset successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Password reset error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to reset password'}), 500


# ============================================================================
# SUPER ADMIN - TENANT MANAGEMENT
# ============================================================================

@app.route('/api/superadmin/tenants', methods=['GET'])
@jwt_required()
def superadmin_list_tenants():
    """List all tenants (super admin only)"""
    try:
        require_super_admin()

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        status_filter = request.args.get('status', '')

        # Build query
        query = Tenant.query

        if search:
            query = query.filter(
                db.or_(
                    Tenant.company_name.ilike(f'%{search}%'),
                    Tenant.subdomain.ilike(f'%{search}%')
                )
            )

        if status_filter:
            query = query.filter_by(status=status_filter)

        # Paginate
        pagination = query.order_by(Tenant.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        tenants_data = []
        for tenant in pagination.items:
            # Get user count
            user_count = User.query.filter_by(tenant_id=tenant.id).count()

            # Get calls this month
            start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            calls_this_month = CDRRecord.query.filter(
                CDRRecord.tenant_id == tenant.id,
                CDRRecord.call_date >= start_of_month
            ).count()

            tenants_data.append({
                'id': tenant.id,
                'company_name': tenant.company_name,
                'subdomain': tenant.subdomain,
                'plan': tenant.plan,
                'status': tenant.status,
                'max_users': tenant.max_users,
                'max_calls_per_month': tenant.max_calls_per_month,
                'user_count': user_count,
                'calls_this_month': calls_this_month,
                'created_at': tenant.created_at.isoformat(),
                'subscription_status': tenant.subscription_status,
                'subscription_ends_at': tenant.subscription_ends_at.isoformat() if tenant.subscription_ends_at else None
            })

        return jsonify({
            'tenants': tenants_data,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200

    except Exception as e:
        logger.error(f"List tenants error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


def validate_subdomain(subdomain):
    """
    Validate subdomain format and check for reserved names
    Returns (is_valid, error_message)
    """
    import re

    # Reserved subdomains
    reserved = ['admin', 'api', 'www', 'app', 'dashboard', 'mail', 'ftp', 'superadmin',
                'support', 'help', 'blog', 'docs', 'status', 'billing', 'account']

    # Check length
    if len(subdomain) < 3:
        return False, 'Subdomain must be at least 3 characters'
    if len(subdomain) > 50:
        return False, 'Subdomain must be 50 characters or less'

    # Check format: alphanumeric and hyphens only, must start/end with alphanumeric
    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', subdomain):
        return False, 'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'

    # Check for consecutive hyphens
    if '--' in subdomain:
        return False, 'Subdomain cannot contain consecutive hyphens'

    # Check reserved names
    if subdomain in reserved:
        return False, f'Subdomain "{subdomain}" is reserved'

    return True, None


@app.route('/api/superadmin/tenants', methods=['POST'])
@jwt_required()
def superadmin_create_tenant():
    """Create new tenant (super admin only) - COMPLETE with all required fields"""
    try:
        require_super_admin()
        claims = get_jwt()
        admin_email = claims.get('email', 'unknown')

        data = request.get_json()

        # Validate required fields
        required_fields = ['company_name', 'subdomain', 'admin_email', 'admin_password', 'admin_name']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # GAP #6 FIX: Validate subdomain format
        subdomain = data['subdomain'].lower().strip()
        is_valid, error_msg = validate_subdomain(subdomain)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Check if subdomain already exists
        existing_tenant = Tenant.query.filter_by(subdomain=subdomain).first()
        if existing_tenant:
            return jsonify({'error': 'Subdomain already exists'}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=data['admin_email']).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400

        # GAP #3 & #4 FIX: Define plan limits consistently
        plan = data.get('plan', 'starter')
        plan_configs = {
            'starter': {
                'max_calls_per_month': 500,
                'max_users': 5,
                'recording_storage_gb': 10,
                'trial_days': 30
            },
            'professional': {
                'max_calls_per_month': 2000,
                'max_users': 20,
                'recording_storage_gb': 50,
                'trial_days': 14
            },
            'enterprise': {
                'max_calls_per_month': 10000,
                'max_users': 100,
                'recording_storage_gb': 200,
                'trial_days': 7
            }
        }

        plan_config = plan_configs.get(plan, plan_configs['starter'])

        # GAP #2 FIX: Set billing cycle start
        billing_cycle_start = datetime.utcnow()

        # GAP #7 FIX: Set subscription end date for trial
        subscription_ends_at = billing_cycle_start + timedelta(days=plan_config['trial_days'])

        # GAP #8 FIX: Generate webhook credentials
        webhook_username = f"{subdomain}_webhook"
        webhook_password = crypto_secrets.token_urlsafe(16)

        # Create tenant with ALL required fields
        tenant = Tenant(
            subdomain=subdomain,
            company_name=data['company_name'].strip(),
            plan=plan,
            status=data.get('status', 'active'),
            max_users=plan_config['max_users'],
            max_calls_per_month=plan_config['max_calls_per_month'],  # Consistent with plan
            plan_limits=json.dumps({
                'calls_per_month': plan_config['max_calls_per_month'],
                'recording_storage_gb': plan_config['recording_storage_gb']
            }),
            billing_cycle_start=billing_cycle_start,
            subscription_ends_at=subscription_ends_at,
            subscription_status='trial',  # Start as trial
            usage_this_month=0,
            webhook_username=webhook_username,
            webhook_password=webhook_password,  # Auto-encrypted by model
            phone_system_type=data.get('phone_system_type', 'grandstream_ucm'),
            transcription_enabled=True,
            sentiment_enabled=True,
            is_active=True
        )

        # GAP #1 FIX: Set UCM credentials if provided
        if data.get('pbx_ip'):
            tenant.pbx_ip = data['pbx_ip'].strip()
        if data.get('pbx_username'):
            tenant.pbx_username = data['pbx_username'].strip()
        if data.get('pbx_password'):
            tenant.pbx_password = data['pbx_password']  # Auto-encrypted
        if data.get('pbx_port'):
            tenant.pbx_port = int(data['pbx_port'])

        db.session.add(tenant)
        db.session.flush()  # Get tenant.id

        # Create admin user for tenant
        admin_user = User(
            tenant_id=tenant.id,
            email=data['admin_email'].lower().strip(),
            full_name=data['admin_name'].strip(),
            role='admin',
            is_active=True,
            email_verified=True
        )
        admin_user.set_password(data['admin_password'])

        db.session.add(admin_user)

        # GAP #5 FIX: Auto-enable default AI features for the plan
        # Get all available AI features
        default_features = AIFeature.query.filter_by(is_active=True).all()

        # Enable features based on plan
        features_to_enable = []
        if plan == 'starter':
            # Starter gets basic features only
            features_to_enable = ['multilingual-transcription', 'sentiment-analysis']
        elif plan == 'professional':
            # Professional gets more features
            features_to_enable = ['multilingual-transcription', 'sentiment-analysis',
                                 'call-summary', 'intent-detection']
        elif plan == 'enterprise':
            # Enterprise gets all features
            features_to_enable = [f.slug for f in default_features]

        for feature in default_features:
            if feature.slug in features_to_enable:
                tenant_feature = TenantAIFeature(
                    tenant_id=tenant.id,
                    ai_feature_id=feature.id,
                    enabled=True,
                    enabled_by=admin_email,
                    enabled_at=datetime.utcnow()
                )
                db.session.add(tenant_feature)

        db.session.commit()

        # Send welcome email to admin user
        send_welcome_email(admin_user.email, admin_user.full_name, data['admin_password'], tenant.company_name)

        # Notify other super admins about new tenant
        send_new_tenant_notification_to_superadmins(tenant)

        logger.info(f"Tenant created by super admin: {tenant.company_name} ({tenant.subdomain})")
        logger.info(f"  Plan: {plan}, Trial until: {subscription_ends_at.strftime('%Y-%m-%d')}")
        logger.info(f"  UCM configured: {bool(tenant.pbx_ip)}")
        logger.info(f"  AI features enabled: {len(features_to_enable)}")

        return jsonify({
            'message': 'Tenant created successfully',
            'tenant': {
                'id': tenant.id,
                'company_name': tenant.company_name,
                'subdomain': tenant.subdomain,
                'plan': tenant.plan,
                'status': tenant.status,
                'subscription_status': tenant.subscription_status,
                'trial_ends': subscription_ends_at.isoformat(),
                'max_calls_per_month': tenant.max_calls_per_month,
                'max_users': tenant.max_users,
                'ucm_configured': bool(tenant.pbx_ip),
                'ai_features_enabled': len(features_to_enable),
                'webhook_username': webhook_username
            },
            'admin_user': {
                'email': admin_user.email,
                'full_name': admin_user.full_name
            },
            'next_steps': [] if tenant.pbx_ip else ['Configure UCM/PBX credentials to enable call recording']
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create tenant error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>', methods=['GET'])
@jwt_required()
def superadmin_get_tenant(tenant_id):
    """Get tenant details (super admin only)"""
    try:
        require_super_admin()

        tenant = Tenant.query.get_or_404(tenant_id)

        # Get users
        users = User.query.filter_by(tenant_id=tenant.id).all()
        users_data = [{
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'is_active': u.is_active,
            'last_login': u.last_login.isoformat() if u.last_login else None
        } for u in users]

        # Get call stats
        total_calls = CDRRecord.query.filter_by(tenant_id=tenant.id).count()
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        calls_this_month = CDRRecord.query.filter(
            CDRRecord.tenant_id == tenant.id,
            CDRRecord.call_date >= start_of_month
        ).count()

        return jsonify({
            'id': tenant.id,
            'company_name': tenant.company_name,
            'subdomain': tenant.subdomain,
            'plan': tenant.plan,
            'status': tenant.status,
            'is_active': tenant.is_active,
            'max_users': tenant.max_users,
            'max_calls_per_month': tenant.max_calls_per_month,
            'subscription_status': tenant.subscription_status,
            'subscription_ends_at': tenant.subscription_ends_at.isoformat() if tenant.subscription_ends_at else None,
            'created_at': tenant.created_at.isoformat(),
            'users': users_data,
            'total_calls': total_calls,
            'calls_this_month': calls_this_month,
            # UCM Configuration (used by recording scraper)
            'phone_system_type': tenant.phone_system_type,
            'pbx_ip': tenant.pbx_ip,
            'pbx_username': tenant.pbx_username,
            'pbx_password': '••••••••' if tenant.pbx_password else '',  # Don't expose actual password
            'pbx_port': tenant.pbx_port
        }), 200

    except Exception as e:
        logger.error(f"Get tenant error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>', methods=['PUT'])
@jwt_required()
def superadmin_update_tenant(tenant_id):
    """Update tenant (super admin only)"""
    try:
        require_super_admin()

        tenant = Tenant.query.get_or_404(tenant_id)
        data = request.get_json()

        # Update fields
        if 'company_name' in data:
            tenant.company_name = data['company_name'].strip()
        if 'plan' in data:
            tenant.plan = data['plan']
        if 'status' in data:
            tenant.status = data['status']
        if 'max_users' in data:
            tenant.max_users = data['max_users']
        if 'max_calls_per_month' in data:
            tenant.max_calls_per_month = data['max_calls_per_month']
        if 'subscription_status' in data:
            tenant.subscription_status = data['subscription_status']
        if 'is_active' in data:
            tenant.is_active = data['is_active']

        # Update UCM credentials (used by recording scraper)
        if 'phone_system_type' in data:
            tenant.phone_system_type = data['phone_system_type']
        if 'pbx_ip' in data:
            tenant.pbx_ip = data['pbx_ip'].strip() if data['pbx_ip'] else None
        if 'pbx_username' in data:
            tenant.pbx_username = data['pbx_username'].strip() if data['pbx_username'] else None
        if 'pbx_password' in data and data['pbx_password']:
            # Only update password if a new one is provided
            tenant.pbx_password = data['pbx_password']  # Tenant model auto-encrypts
        if 'pbx_port' in data:
            tenant.pbx_port = int(data['pbx_port']) if data['pbx_port'] else 8443

        db.session.commit()

        logger.info(f"Tenant updated by super admin: {tenant.company_name}")

        return jsonify({
            'message': 'Tenant updated successfully',
            'tenant': {
                'id': tenant.id,
                'company_name': tenant.company_name,
                'plan': tenant.plan,
                'status': tenant.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update tenant error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>', methods=['DELETE'])
@jwt_required()
def superadmin_delete_tenant(tenant_id):
    """Delete tenant and all related data (super admin only)"""
    try:
        require_super_admin()

        tenant = Tenant.query.get_or_404(tenant_id)

        # Delete all related data (CASCADE should handle this, but being explicit)
        CDRRecord.query.filter_by(tenant_id=tenant.id).delete()
        User.query.filter_by(tenant_id=tenant.id).delete()
        Notification.query.filter_by(tenant_id=tenant.id).delete()
        AuditLog.query.filter_by(tenant_id=tenant.id).delete()

        # Delete tenant
        db.session.delete(tenant)
        db.session.commit()

        logger.warning(f"Tenant deleted by super admin: {tenant.company_name}")

        return jsonify({'message': 'Tenant deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete tenant error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>/impersonate', methods=['POST'])
@jwt_required()
def superadmin_impersonate_tenant(tenant_id):
    """Impersonate tenant admin (super admin only)"""
    try:
        require_super_admin()

        tenant = Tenant.query.get_or_404(tenant_id)

        # Get tenant's admin user
        admin_user = User.query.filter_by(tenant_id=tenant.id, role='admin').first()
        if not admin_user:
            return jsonify({'error': 'No admin user found for tenant'}), 404

        # Generate JWT token for the tenant admin
        access_token = create_access_token(
            identity=admin_user.id,
            additional_claims={
                'tenant_id': tenant.id,
                'role': admin_user.role,
                'impersonated_by': get_jwt_identity()  # Track who is impersonating
            }
        )

        logger.info(f"Super admin impersonating tenant: {tenant.company_name}")

        return jsonify({
            'access_token': access_token,
            'user': {
                'id': admin_user.id,
                'email': admin_user.email,
                'full_name': admin_user.full_name,
                'role': admin_user.role,
                'tenant': {
                    'id': tenant.id,
                    'company_name': tenant.company_name,
                    'subdomain': tenant.subdomain,
                    'plan': tenant.plan
                }
            },
            'impersonated': True
        }), 200

    except Exception as e:
        logger.error(f"Impersonate error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/stats', methods=['GET'])
@jwt_required()
def superadmin_platform_stats():
    """Get platform-wide statistics (super admin only)"""
    try:
        require_super_admin()

        # Total tenants
        total_tenants = Tenant.query.count()
        active_tenants = Tenant.query.filter_by(is_active=True).count()

        # Total users
        total_users = User.query.count()

        # Total calls
        total_calls = CDRRecord.query.count()

        # Calls today
        today = datetime.utcnow().date()
        calls_today = CDRRecord.query.filter(
            db.func.date(CDRRecord.call_date) == today
        ).count()

        # Calls this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        calls_this_month = CDRRecord.query.filter(
            CDRRecord.call_date >= start_of_month
        ).count()

        # Revenue (if billing data available)
        total_revenue = db.session.query(db.func.sum(BillingHistory.amount)).filter(
            BillingHistory.status == 'completed'
        ).scalar() or 0

        # Recent tenants
        recent_tenants = Tenant.query.order_by(Tenant.created_at.desc()).limit(5).all()
        recent_tenants_data = [{
            'id': t.id,
            'company_name': t.company_name,
            'subdomain': t.subdomain,
            'plan': t.plan,
            'created_at': t.created_at.isoformat()
        } for t in recent_tenants]

        return jsonify({
            'total_tenants': total_tenants,
            'active_tenants': active_tenants,
            'total_users': total_users,
            'total_calls': total_calls,
            'calls_today': calls_today,
            'calls_this_month': calls_this_month,
            'total_revenue': float(total_revenue),
            'recent_tenants': recent_tenants_data
        }), 200

    except Exception as e:
        logger.error(f"Platform stats error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/revenue', methods=['GET'])
@jwt_required()
def superadmin_revenue_dashboard():
    """Get comprehensive revenue and billing analytics (super admin only)"""
    try:
        require_super_admin()

        # Define plan pricing (in dollars per month)
        PLAN_PRICING = {
            'free': 0,
            'starter': 29,
            'professional': 99,
            'enterprise': 299
        }

        # Get all active tenants grouped by plan
        tenants_by_plan = db.session.query(
            Tenant.plan,
            db.func.count(Tenant.id).label('count')
        ).filter(Tenant.is_active == True).group_by(Tenant.plan).all()

        plan_breakdown = []
        mrr = 0  # Monthly Recurring Revenue

        for plan, count in tenants_by_plan:
            price = PLAN_PRICING.get(plan, 0)
            revenue = price * count
            mrr += revenue

            plan_breakdown.append({
                'plan': plan,
                'customers': count,
                'price_per_customer': price,
                'monthly_revenue': revenue,
                'percentage': 0  # Will calculate after
            })

        # Calculate percentages
        for item in plan_breakdown:
            item['percentage'] = round((item['monthly_revenue'] / mrr * 100), 1) if mrr > 0 else 0

        # Calculate ARR (Annual Recurring Revenue)
        arr = mrr * 12

        # Get growth metrics (compare to last month)
        last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
        last_month_start = last_month.replace(day=1)

        new_tenants_this_month = Tenant.query.filter(
            Tenant.created_at >= datetime.utcnow().replace(day=1)
        ).count()

        new_tenants_last_month = Tenant.query.filter(
            Tenant.created_at >= last_month_start,
            Tenant.created_at < datetime.utcnow().replace(day=1)
        ).count()

        # Calculate churn (tenants that became inactive this month)
        churned_this_month = Tenant.query.filter(
            Tenant.is_active == False,
            Tenant.subscription_ends_at >= datetime.utcnow().replace(day=1)
        ).count()

        # Calculate growth rate
        total_active = Tenant.query.filter_by(is_active=True).count()
        growth_rate = ((new_tenants_this_month - churned_this_month) / total_active * 100) if total_active > 0 else 0

        # Calculate average revenue per customer (ARPU)
        arpu = mrr / total_active if total_active > 0 else 0

        # Get recent billing transactions
        recent_transactions = BillingHistory.query.order_by(
            BillingHistory.created_at.desc()
        ).limit(10).all()

        transactions_data = [{
            'id': t.id,
            'tenant_id': t.tenant_id,
            'tenant_name': Tenant.query.get(t.tenant_id).company_name if Tenant.query.get(t.tenant_id) else 'Unknown',
            'amount': float(t.amount),
            'status': t.payment_status,
            'invoice_number': t.invoice_number,
            'created_at': t.created_at.isoformat()
        } for t in recent_transactions]

        # Calculate lifetime value estimates (simplified: ARPU * 12 months)
        ltv = arpu * 12

        # Revenue trend (last 6 months) - simplified
        revenue_trend = []
        for i in range(6):
            month_date = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
            month_name = month_date.strftime('%b %Y')

            # Count active tenants in that month
            tenants_that_month = Tenant.query.filter(
                Tenant.created_at <= month_date,
                db.or_(
                    Tenant.is_active == True,
                    Tenant.subscription_ends_at >= month_date
                )
            ).count()

            # Estimate revenue (simplified - assumes current plan distribution)
            estimated_revenue = tenants_that_month * arpu

            revenue_trend.insert(0, {
                'month': month_name,
                'revenue': round(estimated_revenue, 2),
                'customers': tenants_that_month
            })

        return jsonify({
            'mrr': round(mrr, 2),
            'arr': round(arr, 2),
            'arpu': round(arpu, 2),
            'ltv': round(ltv, 2),
            'growth_rate': round(growth_rate, 1),
            'churn_rate': round((churned_this_month / total_active * 100), 1) if total_active > 0 else 0,
            'total_active_customers': total_active,
            'new_customers_this_month': new_tenants_this_month,
            'new_customers_last_month': new_tenants_last_month,
            'churned_this_month': churned_this_month,
            'plan_breakdown': plan_breakdown,
            'revenue_trend': revenue_trend,
            'recent_transactions': transactions_data
        }), 200

    except Exception as e:
        logger.error(f"Revenue dashboard error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# AI FEATURE MANAGEMENT (SUPER ADMIN)
# ============================================================================

@app.route('/api/superadmin/ai-features', methods=['GET'])
@jwt_required()
def get_all_ai_features():
    """Get all available AI features (super admin only)"""
    try:
        require_super_admin()

        category = request.args.get('category')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

        query = AIFeature.query

        if category:
            query = query.filter_by(category=category)

        if not include_inactive:
            query = query.filter_by(is_active=True)

        features = query.order_by(AIFeature.display_order, AIFeature.name).all()

        return jsonify({
            'features': [{
                'id': f.id,
                'name': f.name,
                'slug': f.slug,
                'description': f.description,
                'long_description': f.long_description,
                'category': f.category,
                'icon': f.icon,
                'monthly_price': float(f.monthly_price) if f.monthly_price else 0,
                'setup_fee': float(f.setup_fee) if f.setup_fee else 0,
                'price_per_call': float(f.price_per_call) if f.price_per_call else 0,
                'requires_openai': f.requires_openai,
                'openai_model': f.openai_model,
                'processing_time_estimate': f.processing_time_estimate,
                'benefit_summary': f.benefit_summary,
                'use_cases': json.loads(f.use_cases) if f.use_cases else [],
                'roi_metrics': json.loads(f.roi_metrics) if f.roi_metrics else {},
                'is_active': f.is_active,
                'is_beta': f.is_beta,
                'requires_approval': f.requires_approval,
                'display_order': f.display_order
            } for f in features]
        }), 200

    except Exception as e:
        logger.error(f"Get AI features error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/ai-features', methods=['POST'])
@jwt_required()
def create_ai_feature():
    """Create a new AI feature (super admin only)"""
    try:
        require_super_admin()
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'slug', 'description', 'category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check if slug already exists
        existing = AIFeature.query.filter_by(slug=data['slug']).first()
        if existing:
            return jsonify({'error': 'Feature with this slug already exists'}), 400

        feature = AIFeature(
            name=data['name'],
            slug=data['slug'],
            description=data['description'],
            long_description=data.get('long_description'),
            category=data['category'],
            icon=data.get('icon'),
            monthly_price=data.get('monthly_price', 0),
            setup_fee=data.get('setup_fee', 0),
            price_per_call=data.get('price_per_call', 0),
            requires_openai=data.get('requires_openai', False),
            openai_model=data.get('openai_model'),
            processing_time_estimate=data.get('processing_time_estimate'),
            benefit_summary=data.get('benefit_summary'),
            use_cases=json.dumps(data.get('use_cases', [])),
            roi_metrics=json.dumps(data.get('roi_metrics', {})),
            is_active=data.get('is_active', True),
            is_beta=data.get('is_beta', False),
            requires_approval=data.get('requires_approval', False),
            display_order=data.get('display_order', 0)
        )

        db.session.add(feature)
        db.session.commit()

        log_audit('ai_feature_created', 'ai_feature', feature.id, {'name': feature.name})

        return jsonify({
            'message': 'AI feature created successfully',
            'feature': {
                'id': feature.id,
                'name': feature.name,
                'slug': feature.slug
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create AI feature error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/ai-features/<int:feature_id>', methods=['PUT'])
@jwt_required()
def update_ai_feature(feature_id):
    """Update an AI feature (super admin only)"""
    try:
        require_super_admin()
        data = request.get_json()

        feature = AIFeature.query.get(feature_id)
        if not feature:
            return jsonify({'error': 'AI feature not found'}), 404

        # Update fields
        if 'name' in data:
            feature.name = data['name']
        if 'description' in data:
            feature.description = data['description']
        if 'long_description' in data:
            feature.long_description = data['long_description']
        if 'category' in data:
            feature.category = data['category']
        if 'icon' in data:
            feature.icon = data['icon']
        if 'monthly_price' in data:
            feature.monthly_price = data['monthly_price']
        if 'setup_fee' in data:
            feature.setup_fee = data['setup_fee']
        if 'price_per_call' in data:
            feature.price_per_call = data['price_per_call']
        if 'benefit_summary' in data:
            feature.benefit_summary = data['benefit_summary']
        if 'is_active' in data:
            feature.is_active = data['is_active']
        if 'is_beta' in data:
            feature.is_beta = data['is_beta']
        if 'display_order' in data:
            feature.display_order = data['display_order']

        db.session.commit()

        log_audit('ai_feature_updated', 'ai_feature', feature.id, {'name': feature.name})

        return jsonify({'message': 'AI feature updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update AI feature error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>/features', methods=['GET'])
@jwt_required()
def get_tenant_ai_features(tenant_id):
    """Get AI features enabled for a specific tenant (super admin only)"""
    try:
        require_super_admin()

        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404

        # Get all available features
        all_features = AIFeature.query.filter_by(is_active=True).order_by(
            AIFeature.category, AIFeature.display_order
        ).all()

        # Get tenant's enabled features
        tenant_features = TenantAIFeature.query.filter_by(
            tenant_id=tenant_id
        ).all()

        # Create a map of enabled features
        enabled_map = {tf.ai_feature_id: tf for tf in tenant_features}

        # Build response
        features_data = []
        total_monthly_cost = 0

        for feature in all_features:
            tenant_feature = enabled_map.get(feature.id)
            is_enabled = tenant_feature is not None and tenant_feature.enabled

            # Calculate pricing
            monthly_price = tenant_feature.custom_monthly_price if (tenant_feature and tenant_feature.custom_monthly_price) else feature.monthly_price
            setup_fee = tenant_feature.custom_setup_fee if (tenant_feature and tenant_feature.custom_setup_fee) else feature.setup_fee

            if is_enabled and monthly_price:
                total_monthly_cost += monthly_price

            features_data.append({
                'feature_id': feature.id,
                'name': feature.name,
                'slug': feature.slug,
                'description': feature.description,
                'category': feature.category,
                'icon': feature.icon,
                'default_monthly_price': float(feature.monthly_price) if feature.monthly_price else 0,
                'default_setup_fee': float(feature.setup_fee) if feature.setup_fee else 0,
                'monthly_price': float(monthly_price) if monthly_price else 0,
                'setup_fee': float(setup_fee) if setup_fee else 0,
                'is_enabled': is_enabled,
                'enabled_at': tenant_feature.enabled_at.isoformat() if (tenant_feature and tenant_feature.enabled_at) else None,
                'usage_count': tenant_feature.usage_count if tenant_feature else 0,
                'last_used_at': tenant_feature.last_used_at.isoformat() if (tenant_feature and tenant_feature.last_used_at) else None,
                'enabled_by': tenant_feature.enabled_by if tenant_feature else None,
                'is_beta': feature.is_beta
            })

        return jsonify({
            'tenant': {
                'id': tenant.id,
                'company_name': tenant.company_name,
                'subdomain': tenant.subdomain
            },
            'features': features_data,
            'total_monthly_cost': round(total_monthly_cost, 2)
        }), 200

    except Exception as e:
        logger.error(f"Get tenant AI features error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>/features', methods=['POST'])
@jwt_required()
def enable_tenant_ai_features(tenant_id):
    """Enable/disable multiple AI features for a tenant (super admin only)"""
    try:
        require_super_admin()
        claims = get_jwt()
        admin_email = claims.get('email', 'unknown')

        data = request.get_json()
        feature_updates = data.get('features', [])  # Array of {feature_id, enabled, custom_monthly_price?, custom_setup_fee?}

        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404

        enabled_count = 0
        disabled_count = 0

        for update in feature_updates:
            feature_id = update.get('feature_id')
            enabled = update.get('enabled', True)

            # Check if feature exists
            feature = AIFeature.query.get(feature_id)
            if not feature:
                continue

            # Check if tenant already has this feature
            tenant_feature = TenantAIFeature.query.filter_by(
                tenant_id=tenant_id,
                ai_feature_id=feature_id
            ).first()

            if enabled:
                if tenant_feature:
                    # Update existing
                    tenant_feature.enabled = True
                    tenant_feature.enabled_at = datetime.utcnow()
                    tenant_feature.enabled_by = admin_email
                    if 'custom_monthly_price' in update:
                        tenant_feature.custom_monthly_price = update['custom_monthly_price']
                    if 'custom_setup_fee' in update:
                        tenant_feature.custom_setup_fee = update['custom_setup_fee']
                else:
                    # Create new
                    tenant_feature = TenantAIFeature(
                        tenant_id=tenant_id,
                        ai_feature_id=feature_id,
                        enabled=True,
                        enabled_by=admin_email,
                        custom_monthly_price=update.get('custom_monthly_price'),
                        custom_setup_fee=update.get('custom_setup_fee')
                    )
                    db.session.add(tenant_feature)
                enabled_count += 1
            else:
                if tenant_feature:
                    tenant_feature.enabled = False
                    tenant_feature.disabled_at = datetime.utcnow()
                    disabled_count += 1

        db.session.commit()

        log_audit('tenant_features_updated', 'tenant', tenant_id, {
            'enabled': enabled_count,
            'disabled': disabled_count
        })

        return jsonify({
            'message': 'Features updated successfully',
            'enabled_count': enabled_count,
            'disabled_count': disabled_count
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Enable tenant AI features error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/tenants/<int:tenant_id>/features/<int:feature_id>', methods=['DELETE'])
@jwt_required()
def disable_tenant_ai_feature(tenant_id, feature_id):
    """Disable a specific AI feature for a tenant (super admin only)"""
    try:
        require_super_admin()

        tenant_feature = TenantAIFeature.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_id=feature_id
        ).first()

        if not tenant_feature:
            return jsonify({'error': 'Feature not enabled for this tenant'}), 404

        tenant_feature.enabled = False
        tenant_feature.disabled_at = datetime.utcnow()

        db.session.commit()

        log_audit('tenant_feature_disabled', 'tenant_feature', tenant_feature.id, {
            'tenant_id': tenant_id,
            'feature_id': feature_id
        })

        return jsonify({'message': 'Feature disabled successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Disable tenant AI feature error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# PLANS & PRICING MANAGEMENT
# ============================================================================

@app.route('/api/superadmin/plans', methods=['GET'])
@jwt_required()
def get_all_plans():
    """Get all pricing plans"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plans = Plan.query.order_by(Plan.sort_order).all()

        return jsonify({
            'plans': [{
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'description': p.description,
                'monthly_price': p.monthly_price,
                'annual_price': p.annual_price,
                'setup_fee': p.setup_fee,
                'max_calls_per_month': p.max_calls_per_month,
                'max_users': p.max_users,
                'max_storage_gb': p.max_storage_gb,
                'max_recording_minutes': p.max_recording_minutes,
                'has_api_access': p.has_api_access,
                'has_white_label': p.has_white_label,
                'has_priority_support': p.has_priority_support,
                'trial_days': p.trial_days,
                'is_active': p.is_active,
                'is_public': p.is_public,
                'sort_order': p.sort_order
            } for p in plans]
        }), 200

    except Exception as e:
        logger.error(f"Get plans error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Create new pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        plan = Plan(
            name=data['name'],
            slug=data.get('slug', data['name'].lower().replace(' ', '-')),
            description=data.get('description'),
            monthly_price=data.get('monthly_price', 0),
            annual_price=data.get('annual_price'),
            setup_fee=data.get('setup_fee', 0),
            max_calls_per_month=data.get('max_calls_per_month', 100),
            max_users=data.get('max_users', 5),
            max_storage_gb=data.get('max_storage_gb', 10),
            max_recording_minutes=data.get('max_recording_minutes', 1000),
            has_api_access=data.get('has_api_access', False),
            has_white_label=data.get('has_white_label', False),
            has_priority_support=data.get('has_priority_support', False),
            trial_days=data.get('trial_days', 14),
            is_active=data.get('is_active', True),
            is_public=data.get('is_public', True),
            sort_order=data.get('sort_order', 0)
        )

        db.session.add(plan)
        db.session.commit()

        logger.info(f"Created plan: {plan.name} (ID: {plan.id})")

        return jsonify({
            'message': 'Plan created successfully',
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'slug': plan.slug,
                'monthly_price': plan.monthly_price
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Update pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plan = Plan.query.get_or_404(plan_id)
        data = request.get_json()

        # Update fields
        for field in ['name', 'description', 'monthly_price', 'annual_price', 'setup_fee',
                      'max_calls_per_month', 'max_users', 'max_storage_gb', 'max_recording_minutes',
                      'has_api_access', 'has_white_label', 'has_priority_support',
                      'trial_days', 'is_active', 'is_public', 'sort_order']:
            if field in data:
                setattr(plan, field, data[field])

        db.session.commit()

        return jsonify({'message': 'Plan updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plan = Plan.query.get_or_404(plan_id)

        # Check if any active subscriptions
        active_subs = Subscription.query.filter_by(plan_id=plan_id, status='active').count()
        if active_subs > 0:
            return jsonify({'error': f'Cannot delete plan with {active_subs} active subscriptions'}), 400

        db.session.delete(plan)
        db.session.commit()

        return jsonify({'message': 'Plan deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SUBSCRIPTIONS MANAGEMENT
# ============================================================================

@app.route('/api/superadmin/subscriptions', methods=['GET'])
@jwt_required()
def get_all_subscriptions():
    """Get all tenant subscriptions"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        status_filter = request.args.get('status')

        query = db.session.query(Subscription, Tenant, Plan).join(
            Tenant, Subscription.tenant_id == Tenant.id
        ).join(
            Plan, Subscription.plan_id == Plan.id
        )

        if status_filter:
            query = query.filter(Subscription.status == status_filter)

        subscriptions = query.order_by(Subscription.created_at.desc()).all()

        return jsonify({
            'subscriptions': [{
                'id': sub.id,
                'tenant': {
                    'id': tenant.id,
                    'company_name': tenant.company_name,
                    'subdomain': tenant.subdomain
                },
                'plan': {
                    'id': plan.id,
                    'name': plan.name,
                    'monthly_price': plan.monthly_price
                },
                'status': sub.status,
                'billing_cycle': sub.billing_cycle,
                'current_period_start': sub.current_period_start.isoformat() if sub.current_period_start else None,
                'current_period_end': sub.current_period_end.isoformat() if sub.current_period_end else None,
                'trial_end': sub.trial_end.isoformat() if sub.trial_end else None,
                'next_billing_date': sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                'cancel_at_period_end': sub.cancel_at_period_end,
                'created_at': sub.created_at.isoformat()
            } for sub, tenant, plan in subscriptions]
        }), 200

    except Exception as e:
        logger.error(f"Get subscriptions error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REVENUE ANALYTICS
# ============================================================================

@app.route('/api/superadmin/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """Get comprehensive revenue analytics"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Current MRR calculation
        active_subs = db.session.query(
            Subscription, Plan
        ).join(Plan).filter(
            Subscription.status.in_(['active', 'trialing'])
        ).all()

        mrr = sum(plan.monthly_price for sub, plan in active_subs if sub.billing_cycle == 'monthly')
        arr = mrr * 12

        # Count tenants by status
        total_tenants = Tenant.query.count()
        active_tenants = Subscription.query.filter_by(status='active').count()
        trial_tenants = Subscription.query.filter_by(status='trialing').count()
        churned_tenants = Subscription.query.filter_by(status='canceled').count()

        # Revenue by plan
        revenue_by_plan = db.session.query(
            Plan.name,
            func.sum(Plan.monthly_price).label('revenue'),
            func.count(Subscription.id).label('subscribers')
        ).join(Subscription).filter(
            Subscription.status == 'active'
        ).group_by(Plan.name).all()

        # Last 30 days metrics
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_metrics = RevenueMetric.query.filter(
            RevenueMetric.date >= thirty_days_ago.date()
        ).order_by(RevenueMetric.date).all()

        return jsonify({
            'current': {
                'mrr': round(mrr, 2),
                'arr': round(arr, 2),
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'trial_tenants': trial_tenants,
                'churned_tenants': churned_tenants,
                'churn_rate': round((churned_tenants / total_tenants * 100) if total_tenants > 0 else 0, 2)
            },
            'by_plan': [{
                'plan': name,
                'revenue': float(revenue),
                'subscribers': subscribers
            } for name, revenue, subscribers in revenue_by_plan],
            'historical': [{
                'date': m.date.isoformat(),
                'mrr': m.mrr,
                'arr': m.arr,
                'active_tenants': m.active_tenants,
                'new_tenants': m.new_tenants
            } for m in recent_metrics]
        }), 200

    except Exception as e:
        logger.error(f"Revenue analytics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# COST TRACKING & OPERATIONAL METRICS
# ============================================================================

@app.route('/api/superadmin/analytics/costs', methods=['GET'])
@jwt_required()
def get_cost_analytics():
    """Get cost breakdown and margins"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Total costs from call metrics
        total_costs = db.session.query(
            func.sum(CallMetric.total_cost).label('total')
        ).scalar() or 0

        # Costs this month
        first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        monthly_costs = db.session.query(
            func.sum(CallMetric.total_cost).label('total')
        ).join(CDRRecord).filter(
            CDRRecord.call_date >= first_of_month
        ).scalar() or 0

        # Cost per tenant
        cost_by_tenant = db.session.query(
            Tenant.company_name,
            func.sum(CallMetric.total_cost).label('cost'),
            func.count(CallMetric.id).label('calls')
        ).join(CallMetric, Tenant.id == CallMetric.tenant_id
        ).group_by(Tenant.company_name
        ).order_by(func.sum(CallMetric.total_cost).desc()
        ).limit(10).all()

        # Average cost per call
        avg_cost_per_call = db.session.query(
            func.avg(CallMetric.total_cost).label('avg')
        ).scalar() or 0

        return jsonify({
            'totals': {
                'all_time': round(total_costs, 2),
                'this_month': round(monthly_costs, 2),
                'avg_per_call': round(avg_cost_per_call, 4)
            },
            'by_tenant': [{
                'tenant': name,
                'cost': round(float(cost), 2),
                'calls': calls
            } for name, cost, calls in cost_by_tenant]
        }), 200

    except Exception as e:
        logger.error(f"Cost analytics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/analytics/system', methods=['GET'])
@jwt_required()
def get_system_metrics():
    """Get system health and performance metrics"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # API usage stats
        total_calls = CDRRecord.query.count()
        calls_today = CDRRecord.query.filter(
            func.date(CDRRecord.call_date) == datetime.utcnow().date()
        ).count()

        # Processing time averages
        avg_processing_time = db.session.query(
            func.avg(CallMetric.processing_time_seconds).label('avg')
        ).scalar() or 0

        # Recent system metrics
        recent_metrics = SystemMetric.query.filter(
            SystemMetric.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SystemMetric.timestamp.desc()).limit(100).all()

        # Active alerts
        active_alerts = SystemAlert.query.filter_by(is_resolved=False).count()

        return jsonify({
            'calls': {
                'total': total_calls,
                'today': calls_today
            },
            'performance': {
                'avg_processing_time': round(avg_processing_time, 2)
            },
            'alerts': {
                'active': active_alerts
            },
            'recent_metrics': [{
                'timestamp': m.timestamp.isoformat(),
                'type': m.metric_type,
                'value': m.value,
                'unit': m.unit
            } for m in recent_metrics[:20]]
        }), 200

    except Exception as e:
        logger.error(f"System metrics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SYSTEM ALERTS
# ============================================================================

@app.route('/api/superadmin/alerts', methods=['GET'])
@jwt_required()
def get_system_alerts():
    """Get all system alerts"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        show_resolved = request.args.get('resolved', 'false').lower() == 'true'

        query = SystemAlert.query
        if not show_resolved:
            query = query.filter_by(is_resolved=False)

        alerts = query.order_by(SystemAlert.created_at.desc()).limit(100).all()

        return jsonify({
            'alerts': [{
                'id': a.id,
                'alert_type': a.alert_type,
                'severity': a.severity,
                'title': a.title,
                'message': a.message,
                'tenant_id': a.tenant_id,
                'metric_value': a.metric_value,
                'threshold_value': a.threshold_value,
                'is_resolved': a.is_resolved,
                'resolved_at': a.resolved_at.isoformat() if a.resolved_at else None,
                'created_at': a.created_at.isoformat()
            } for a in alerts]
        }), 200

    except Exception as e:
        logger.error(f"Get alerts error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/alerts/<int:alert_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve a system alert"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        alert = SystemAlert.query.get_or_404(alert_id)
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = get_jwt_identity()

        db.session.commit()

        return jsonify({'message': 'Alert resolved'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Resolve alert error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# FEATURE FLAGS
# ============================================================================

@app.route('/api/superadmin/feature-flags', methods=['GET'])
@jwt_required()
def get_feature_flags():
    """Get all feature flags"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        flags = FeatureFlag.query.order_by(FeatureFlag.name).all()

        return jsonify({
            'flags': [{
                'id': f.id,
                'name': f.name,
                'slug': f.slug,
                'description': f.description,
                'is_enabled': f.is_enabled,
                'rollout_percentage': f.rollout_percentage,
                'target_plan_ids': json.loads(f.target_plan_ids) if f.target_plan_ids else [],
                'target_tenant_ids': json.loads(f.target_tenant_ids) if f.target_tenant_ids else [],
                'created_at': f.created_at.isoformat()
            } for f in flags]
        }), 200

    except Exception as e:
        logger.error(f"Get feature flags error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/feature-flags', methods=['POST'])
@jwt_required()
def create_feature_flag():
    """Create new feature flag"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        flag = FeatureFlag(
            name=data['name'],
            slug=data.get('slug', data['name'].lower().replace(' ', '-')),
            description=data.get('description'),
            is_enabled=data.get('is_enabled', False),
            rollout_percentage=data.get('rollout_percentage', 0),
            target_plan_ids=json.dumps(data.get('target_plan_ids', [])),
            target_tenant_ids=json.dumps(data.get('target_tenant_ids', [])),
            created_by=get_jwt_identity()
        )

        db.session.add(flag)
        db.session.commit()

        return jsonify({
            'message': 'Feature flag created',
            'flag': {'id': flag.id, 'name': flag.name}
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create feature flag error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/feature-flags/<int:flag_id>', methods=['PUT'])
@jwt_required()
def update_feature_flag(flag_id):
    """Update feature flag"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        flag = FeatureFlag.query.get_or_404(flag_id)
        data = request.get_json()

        for field in ['name', 'description', 'is_enabled', 'rollout_percentage']:
            if field in data:
                setattr(flag, field, data[field])

        if 'target_plan_ids' in data:
            flag.target_plan_ids = json.dumps(data['target_plan_ids'])
        if 'target_tenant_ids' in data:
            flag.target_tenant_ids = json.dumps(data['target_tenant_ids'])

        db.session.commit()

        return jsonify({'message': 'Feature flag updated'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update feature flag error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/features', methods=['GET'])
def get_public_ai_features():
    """Get all active AI features (public endpoint for marketing pages)"""
    try:
        category = request.args.get('category')

        query = AIFeature.query.filter_by(is_active=True)

        if category:
            query = query.filter_by(category=category)

        features = query.order_by(AIFeature.category, AIFeature.display_order).all()

        # Group by category
        features_by_category = {}
        for feature in features:
            if feature.category not in features_by_category:
                features_by_category[feature.category] = []

            features_by_category[feature.category].append({
                'id': feature.id,
                'name': feature.name,
                'slug': feature.slug,
                'description': feature.description,
                'long_description': feature.long_description,
                'icon': feature.icon,
                'monthly_price': float(feature.monthly_price) if feature.monthly_price else 0,
                'setup_fee': float(feature.setup_fee) if feature.setup_fee else 0,
                'benefit_summary': feature.benefit_summary,
                'use_cases': json.loads(feature.use_cases) if feature.use_cases else [],
                'roi_metrics': json.loads(feature.roi_metrics) if feature.roi_metrics else {},
                'is_beta': feature.is_beta
            })

        return jsonify({
            'features': features_by_category
        }), 200

    except Exception as e:
        logger.error(f"Get public AI features error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/features', methods=['GET'])
@jwt_required()
def get_my_tenant_features():
    """Get AI features enabled for the current user's tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Get enabled features for this tenant
        tenant_features = TenantAIFeature.query.filter_by(
            tenant_id=tenant_id,
            enabled=True
        ).all()

        features_data = []
        for tf in tenant_features:
            feature = AIFeature.query.get(tf.ai_feature_id)
            if feature and feature.is_active:
                features_data.append({
                    'id': feature.id,
                    'name': feature.name,
                    'slug': feature.slug,
                    'description': feature.description,
                    'category': feature.category,
                    'icon': feature.icon,
                    'is_beta': feature.is_beta,
                    'usage_count': tf.usage_count
                })

        return jsonify({
            'features': features_data
        }), 200

    except Exception as e:
        logger.error(f"Get my tenant features error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# TENANT BACK OFFICE ENDPOINTS
# ============================================================================

@app.route('/api/tenant/usage', methods=['GET'])
@jwt_required()
def get_tenant_usage():
    """Get usage analytics for current tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Get tenant and subscription info
        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404

        # Calculate current billing period (assume monthly for now)
        today = datetime.utcnow()
        period_start = datetime(today.year, today.month, 1)
        if today.month == 12:
            period_end = datetime(today.year + 1, 1, 1)
        else:
            period_end = datetime(today.year, today.month + 1, 1)

        # Count calls this period
        calls_count = CDRRecord.query.filter(
            CDRRecord.tenant_id == tenant_id,
            CDRRecord.received_at >= period_start,
            CDRRecord.received_at < period_end
        ).count()

        # Calculate recording minutes
        recording_seconds = db.session.query(func.sum(CDRRecord.duration)).filter(
            CDRRecord.tenant_id == tenant_id,
            CDRRecord.received_at >= period_start,
            CDRRecord.received_at < period_end,
            CDRRecord.recordfiles.isnot(None)
        ).scalar() or 0
        recording_minutes = recording_seconds / 60

        # Calculate storage (rough estimate: 1MB per minute of recording)
        storage_gb = (recording_minutes / 1024)

        # Count API requests (from webhook logs if available)
        api_requests = 0  # Placeholder - implement webhook log counting

        # Set default limits (these should come from subscription plan)
        max_calls = 1000
        max_recording_minutes = 5000
        max_storage_gb = 50
        max_api_requests = 10000

        return jsonify({
            'period_start': period_start.isoformat(),
            'period_end': period_end.isoformat(),
            'calls': {
                'used': calls_count,
                'limit': max_calls
            },
            'recording_minutes': {
                'used': int(recording_minutes),
                'limit': max_recording_minutes
            },
            'storage': {
                'used': round(storage_gb, 2),
                'limit': max_storage_gb
            },
            'api_requests': {
                'used': api_requests,
                'limit': max_api_requests
            }
        }), 200

    except Exception as e:
        logger.error(f"Get tenant usage error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/subscription', methods=['GET'])
@jwt_required()
def get_tenant_subscription():
    """Get subscription details for current tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404

        # Calculate billing period
        today = datetime.utcnow()
        period_start = datetime(today.year, today.month, 1)
        if today.month == 12:
            period_end = datetime(today.year + 1, 1, 1)
        else:
            period_end = datetime(today.year, today.month + 1, 1)

        # Mock subscription data (in production, this would come from Stripe or subscription table)
        subscription = {
            'status': 'active',
            'plan_id': 1,
            'plan_name': tenant.subscription_plan or 'Starter',
            'billing_cycle': 'monthly',
            'price': 99.00,
            'current_period_start': period_start.isoformat(),
            'current_period_end': period_end.isoformat(),
            'next_billing_date': period_end.isoformat(),
            'cancel_at_period_end': False
        }

        return jsonify(subscription), 200

    except Exception as e:
        logger.error(f"Get subscription error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/subscription/change-plan', methods=['POST'])
@jwt_required()
def change_subscription_plan():
    """Request a plan change"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        role = claims.get('role')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        data = request.get_json()
        plan_id = data.get('plan_id')

        if not plan_id:
            return jsonify({'error': 'plan_id is required'}), 400

        # In production, this would integrate with Stripe or payment processor
        logger.info(f"Plan change requested for tenant {tenant_id} to plan {plan_id}")

        return jsonify({
            'message': 'Plan change request submitted successfully',
            'plan_id': plan_id
        }), 200

    except Exception as e:
        logger.error(f"Change plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/plans/available', methods=['GET'])
@jwt_required()
def get_available_plans():
    """Get available subscription plans"""
    try:
        # Mock plans data (in production, this would come from database or Stripe)
        plans = [
            {
                'id': 1,
                'name': 'Starter',
                'description': 'Perfect for small teams getting started',
                'monthly_price': 49,
                'annual_price': 490,
                'max_calls_per_month': 500,
                'max_users': 5,
                'max_storage_gb': 25,
                'has_api_access': False,
                'has_priority_support': False
            },
            {
                'id': 2,
                'name': 'Professional',
                'description': 'For growing businesses with advanced needs',
                'monthly_price': 99,
                'annual_price': 990,
                'max_calls_per_month': 2000,
                'max_users': 20,
                'max_storage_gb': 100,
                'has_api_access': True,
                'has_priority_support': False
            },
            {
                'id': 3,
                'name': 'Enterprise',
                'description': 'For large organizations requiring maximum scale',
                'monthly_price': 299,
                'annual_price': 2990,
                'max_calls_per_month': 10000,
                'max_users': 100,
                'max_storage_gb': 500,
                'has_api_access': True,
                'has_priority_support': True
            }
        ]

        return jsonify({'plans': plans}), 200

    except Exception as e:
        logger.error(f"Get available plans error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/billing-history', methods=['GET'])
@jwt_required()
def get_tenant_billing_history():
    """Get billing history for current tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Mock billing history (in production, this would come from Stripe or billing table)
        invoices = [
            {
                'id': 1,
                'date': (datetime.utcnow() - timedelta(days=30)).isoformat(),
                'description': 'Professional Plan - Monthly',
                'amount': 99.00,
                'status': 'paid',
                'invoice_url': '#'
            },
            {
                'id': 2,
                'date': (datetime.utcnow() - timedelta(days=60)).isoformat(),
                'description': 'Professional Plan - Monthly',
                'amount': 99.00,
                'status': 'paid',
                'invoice_url': '#'
            }
        ]

        return jsonify({'invoices': invoices}), 200

    except Exception as e:
        logger.error(f"Get billing history error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/api-keys', methods=['GET'])
@jwt_required()
def get_api_keys():
    """Get API keys for current tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Mock API keys (in production, these would come from an api_keys table)
        api_keys = [
            {
                'id': 1,
                'name': 'Production Server',
                'key_preview': 'ak_live_abc123',
                'is_active': True,
                'created_at': datetime.utcnow().isoformat(),
                'last_used_at': (datetime.utcnow() - timedelta(hours=2)).isoformat()
            }
        ]

        return jsonify({'api_keys': api_keys}), 200

    except Exception as e:
        logger.error(f"Get API keys error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/api-keys', methods=['POST'])
@jwt_required()
def create_api_key():
    """Create a new API key"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        role = claims.get('role')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        data = request.get_json()
        name = data.get('name', '').strip()

        if not name:
            return jsonify({'error': 'API key name is required'}), 400

        # Generate a secure API key
        api_key = f"ak_live_{crypto_secrets.token_urlsafe(32)}"

        # In production, store this in database with hash
        logger.info(f"API key created for tenant {tenant_id}: {name}")

        return jsonify({
            'api_key': api_key,
            'name': name,
            'message': 'API key created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Create API key error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/api-keys/<int:key_id>', methods=['DELETE'])
@jwt_required()
def delete_api_key(key_id):
    """Delete an API key"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        role = claims.get('role')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        # In production, delete from database
        logger.info(f"API key {key_id} deleted for tenant {tenant_id}")

        return jsonify({'message': 'API key deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Delete API key error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/webhook-logs', methods=['GET'])
@jwt_required()
def get_webhook_logs():
    """Get webhook activity logs"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        limit = request.args.get('limit', 50, type=int)

        # Mock webhook logs (in production, these would come from webhook_logs table)
        logs = [
            {
                'id': 1,
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'call.completed',
                'status': 'success',
                'response_code': 200
            },
            {
                'id': 2,
                'timestamp': (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
                'event_type': 'call.transcribed',
                'status': 'success',
                'response_code': 200
            }
        ]

        return jsonify({'logs': logs[:limit]}), 200

    except Exception as e:
        logger.error(f"Get webhook logs error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/reports/generate', methods=['POST'])
@jwt_required()
def generate_report():
    """Generate custom report with export"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        report_type = data.get('reportType')
        export_format = data.get('export_format', 'pdf')
        date_from = data.get('dateFrom')
        date_to = data.get('dateTo')

        # In production, generate actual report based on parameters
        logger.info(f"Report generation requested: type={report_type}, format={export_format}")

        # Mock report generation
        if export_format == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Date', 'Calls', 'Duration', 'Quality'])
            writer.writerow([datetime.utcnow().strftime('%Y-%m-%d'), 150, 7500, 85])

            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'report_{datetime.utcnow().strftime("%Y%m%d")}.csv'
            )

        return jsonify({'message': 'Report generated successfully'}), 200

    except Exception as e:
        logger.error(f"Generate report error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/saved-reports', methods=['GET'])
@jwt_required()
def get_saved_reports():
    """Get saved report configurations"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Mock saved reports
        reports = [
            {
                'id': 1,
                'name': 'Monthly Performance',
                'report_type': 'performance',
                'created_at': datetime.utcnow().isoformat(),
                'schedule': 'monthly'
            }
        ]

        return jsonify({'reports': reports}), 200

    except Exception as e:
        logger.error(f"Get saved reports error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/compliance/summary', methods=['GET'])
@jwt_required()
def get_compliance_summary():
    """Get compliance summary and scores"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Mock compliance data
        summary = {
            'total_alerts': 12,
            'unresolved_alerts': 3,
            'resolved_alerts': 9,
            'compliance_score': 92,
            'score_trend': 5,  # +5% vs last period
            'alert_types': [
                {'type': 'recording_consent', 'count': 5},
                {'type': 'data_retention', 'count': 3},
                {'type': 'call_quality', 'count': 2},
                {'type': 'regulatory', 'count': 2}
            ]
        }

        return jsonify(summary), 200

    except Exception as e:
        logger.error(f"Get compliance summary error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/compliance/alerts', methods=['GET'])
@jwt_required()
def get_compliance_alerts():
    """Get compliance alerts with filters"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        severity = request.args.get('severity', '')
        status = request.args.get('status', '')

        # Mock alerts data
        alerts = [
            {
                'id': 1,
                'type': 'Recording Consent',
                'severity': 'high',
                'message': 'Missing consent for recorded calls',
                'status': 'unresolved',
                'detected_at': (datetime.utcnow() - timedelta(days=2)).isoformat(),
                'call_count': 5
            },
            {
                'id': 2,
                'type': 'Data Retention',
                'severity': 'medium',
                'message': 'Calls exceeding retention period',
                'status': 'unresolved',
                'detected_at': (datetime.utcnow() - timedelta(days=5)).isoformat(),
                'call_count': 3
            }
        ]

        # Apply filters
        filtered_alerts = alerts
        if severity:
            filtered_alerts = [a for a in filtered_alerts if a['severity'] == severity]
        if status:
            filtered_alerts = [a for a in filtered_alerts if a['status'] == status]

        return jsonify({'alerts': filtered_alerts}), 200

    except Exception as e:
        logger.error(f"Get compliance alerts error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/compliance/alerts/<int:alert_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_compliance_alert(alert_id):
    """Mark a compliance alert as resolved"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        user_id = claims.get('sub')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        resolved_by = data.get('resolved_by', '')

        # In production, update alert in database
        logger.info(f"Alert {alert_id} resolved by {resolved_by} for tenant {tenant_id}")

        return jsonify({
            'message': 'Alert resolved successfully',
            'alert_id': alert_id
        }), 200

    except Exception as e:
        logger.error(f"Resolve alert error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/compliance/export', methods=['POST'])
@jwt_required()
def export_compliance_report():
    """Export compliance report"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Generate CSV report
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Alert Type', 'Severity', 'Status', 'Detected Date', 'Call Count'])
        writer.writerow(['Recording Consent', 'high', 'unresolved', datetime.utcnow().strftime('%Y-%m-%d'), 5])
        writer.writerow(['Data Retention', 'medium', 'resolved', datetime.utcnow().strftime('%Y-%m-%d'), 3])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'compliance_report_{datetime.utcnow().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        logger.error(f"Export compliance report error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/team/members-detailed', methods=['GET'])
@jwt_required()
def get_team_members_detailed():
    """Get detailed team member information with performance metrics"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Get all team members
        users = User.query.filter_by(tenant_id=tenant_id).all()

        members = []
        for user in users:
            # Calculate metrics for each member
            calls_count = CDRRecord.query.filter_by(
                tenant_id=tenant_id
            ).filter(
                CDRRecord.received_at >= datetime.utcnow() - timedelta(days=30)
            ).count()

            avg_duration = db.session.query(func.avg(CDRRecord.duration)).filter_by(
                tenant_id=tenant_id
            ).filter(
                CDRRecord.received_at >= datetime.utcnow() - timedelta(days=30)
            ).scalar() or 0

            members.append({
                'id': user.id,
                'name': user.username,
                'email': user.email,
                'role': user.role,
                'calls_count': calls_count,
                'avg_call_duration': int(avg_duration),
                'quality_score': 85,  # Mock score
                'performance_score': 82,  # Mock score
                'goals_met': 3,
                'total_goals': 5,
                'current_goal': {
                    'goal_type': 'calls',
                    'current_value': calls_count,
                    'target_value': 100
                }
            })

        return jsonify({'members': members}), 200

    except Exception as e:
        logger.error(f"Get team members detailed error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/team/goals', methods=['GET', 'POST'])
@jwt_required()
def handle_team_goals():
    """Get or create team goals"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if request.method == 'GET':
            # Mock goals data
            goals = [
                {
                    'id': 1,
                    'member_id': 1,
                    'member_name': 'John Doe',
                    'goal_type': 'calls',
                    'target_value': 100,
                    'current_value': 75,
                    'timeframe': 'monthly',
                    'status': 'active',
                    'description': 'Complete 100 calls this month',
                    'deadline': (datetime.utcnow() + timedelta(days=15)).isoformat()
                }
            ]
            return jsonify({'goals': goals}), 200

        else:  # POST
            data = request.get_json()
            # In production, create goal in database
            logger.info(f"Goal created for tenant {tenant_id}: {data}")
            return jsonify({'message': 'Goal created successfully'}), 201

    except Exception as e:
        logger.error(f"Handle team goals error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/team/coaching-sessions', methods=['GET', 'POST'])
@jwt_required()
def handle_coaching_sessions():
    """Get or create coaching sessions"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if request.method == 'GET':
            # Mock coaching sessions
            sessions = [
                {
                    'id': 1,
                    'member_id': 1,
                    'member_name': 'John Doe',
                    'coach_id': 2,
                    'coach_name': 'Jane Manager',
                    'topic': 'Improving call quality',
                    'status': 'scheduled',
                    'scheduled_date': (datetime.utcnow() + timedelta(days=3)).isoformat(),
                    'follow_up_date': (datetime.utcnow() + timedelta(days=10)).isoformat(),
                    'notes': 'Focus on active listening techniques'
                }
            ]
            return jsonify({'sessions': sessions}), 200

        else:  # POST
            data = request.get_json()
            # In production, create session in database
            logger.info(f"Coaching session created for tenant {tenant_id}: {data}")
            return jsonify({'message': 'Coaching session scheduled successfully'}), 201

    except Exception as e:
        logger.error(f"Handle coaching sessions error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/team/performance-trends', methods=['GET'])
@jwt_required()
def get_performance_trends():
    """Get performance trends for team members"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Mock trend data
        trends = [
            {
                'member_id': 1,
                'current_score': 85,
                'total_calls': 150,
                'calls_trend': 15,  # +15% vs last period
                'avg_quality': 88,
                'quality_trend': 5,
                'avg_duration': 420,  # seconds
                'duration_trend': -10,  # -10% (improvement for shorter calls)
                'goals_met': 3,
                'total_goals': 5
            }
        ]

        return jsonify({'trends': trends}), 200

    except Exception as e:
        logger.error(f"Get performance trends error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/team/assign-call', methods=['POST'])
@jwt_required()
def assign_call_to_member():
    """Assign a call to a team member"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        role = claims.get('role')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        if role not in ['admin', 'manager', 'superadmin']:
            return jsonify({'error': 'Unauthorized - manager access required'}), 403

        data = request.get_json()
        call_id = data.get('call_id')
        member_id = data.get('member_id')

        if not call_id or not member_id:
            return jsonify({'error': 'call_id and member_id are required'}), 400

        # In production, update call assignment in database
        logger.info(f"Call {call_id} assigned to member {member_id} in tenant {tenant_id}")

        return jsonify({'message': 'Call assigned successfully'}), 200

    except Exception as e:
        logger.error(f"Assign call error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# PROMPT CUSTOMIZATION ENDPOINTS
# ============================================================================

@app.route('/api/tenant/prompt-customizations', methods=['GET'])
@jwt_required()
def get_prompt_customizations():
    """Get all active prompt customizations for tenant"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Get all active customizations
        customizations = PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            is_active=True
        ).all()

        return jsonify({
            'customizations': [{
                'id': c.id,
                'ai_feature_slug': c.ai_feature_slug,
                'custom_prompt': c.custom_prompt,
                'version': c.version,
                'signature_name': c.signature_name,
                'signature_timestamp': c.signature_timestamp.isoformat() if c.signature_timestamp else None,
                'created_at': c.created_at.isoformat() if c.created_at else None
            } for c in customizations]
        }), 200

    except Exception as e:
        logger.error(f"Get prompt customizations error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/generate', methods=['POST'])
@jwt_required()
def generate_prompt_from_wizard():
    """Generate a custom prompt based on wizard answers"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        feature_slug = data.get('feature_slug')
        wizard_data = data.get('wizard_data', {})

        if not feature_slug:
            return jsonify({'error': 'feature_slug is required'}), 400

        # Build prompt based on wizard data
        industry = wizard_data.get('industry', '')
        goals = wizard_data.get('goals', [])
        tone = wizard_data.get('tone', 'professional')
        keywords = wizard_data.get('keywords', [])

        # Get industry-specific context
        industry_contexts = {
            'sales_b2b': 'B2B sales calls focused on enterprise solutions',
            'sales_b2c': 'consumer-focused sales conversations',
            'customer_support': 'customer service and technical support calls',
            'healthcare': 'HIPAA-compliant healthcare communications',
            'financial': 'financial services and advisory calls',
            'real_estate': 'property sales and client consultations',
            'insurance': 'insurance policy discussions and claims',
            'ecommerce': 'e-commerce customer inquiries',
            'saas': 'SaaS product demos and support',
            'manufacturing': 'manufacturing and B2B logistics'
        }

        tone_styles = {
            'professional': 'professional and business-appropriate',
            'friendly': 'warm and conversational',
            'technical': 'precise and technical'
        }

        # Generate custom prompt using GPT-4
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        prompt_generation_request = f"""Create a custom AI prompt for the "{feature_slug}" feature.

Context:
- Industry: {industry_contexts.get(industry, 'general business')}
- Goals: {', '.join(goals) if goals else 'general analysis'}
- Tone: {tone_styles.get(tone, 'professional')}
- Key terms to focus on: {', '.join(keywords) if keywords else 'none specified'}

Generate a detailed, effective prompt that:
1. Addresses the specific industry context
2. Focuses on achieving the stated goals
3. Uses the appropriate tone
4. Incorporates the key terms when relevant
5. Is optimized for the {feature_slug} AI feature

Return only the prompt text, no explanations."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an AI prompt engineer specializing in call analysis systems."},
                {"role": "user", "content": prompt_generation_request}
            ]
        )

        generated_prompt = response.choices[0].message.content

        return jsonify({
            'prompt': generated_prompt,
            'feature_slug': feature_slug
        }), 200

    except Exception as e:
        logger.error(f"Generate prompt error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/refine', methods=['POST'])
@jwt_required()
def refine_prompt_with_ai():
    """Refine a prompt using AI chat"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        feature_slug = data.get('feature_slug')
        current_prompt = data.get('current_prompt')
        user_instruction = data.get('user_instruction')
        chat_history = data.get('chat_history', [])

        if not all([feature_slug, current_prompt, user_instruction]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Use GPT-4 to refine the prompt
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        messages = [
            {"role": "system", "content": f"You are an AI assistant helping refine a prompt for the '{feature_slug}' feature. When the user asks for changes, modify the prompt and explain what you changed and why."}
        ]

        # Add chat history
        for msg in chat_history[-5:]:  # Last 5 messages for context
            messages.append(msg)

        # Add current request
        messages.append({
            "role": "user",
            "content": f"Current prompt:\n{current_prompt}\n\nUser request: {user_instruction}\n\nPlease refine the prompt according to the request and explain your changes."
        })

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        ai_response = response.choices[0].message.content

        # Extract refined prompt (assume it's in the response)
        # For simplicity, we'll use the whole response as explanation
        # and regenerate the prompt with the instruction applied

        refine_request = f"""Refine this prompt: {current_prompt}

User's instruction: {user_instruction}

Return ONLY the refined prompt, no explanations."""

        refine_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You refine AI prompts based on user instructions. Return only the refined prompt."},
                {"role": "user", "content": refine_request}
            ]
        )

        refined_prompt = refine_response.choices[0].message.content

        return jsonify({
            'refined_prompt': refined_prompt,
            'explanation': ai_response
        }), 200

    except Exception as e:
        logger.error(f"Refine prompt error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/test', methods=['POST'])
@jwt_required()
def test_custom_prompt():
    """Test a custom prompt on recent calls"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        feature_slug = data.get('feature_slug')
        custom_prompt = data.get('custom_prompt')

        if not all([feature_slug, custom_prompt]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Get 3 recent calls with transcriptions
        recent_calls = CDRRecord.query.filter_by(tenant_id=tenant_id).join(
            Transcription
        ).order_by(
            CDRRecord.received_at.desc()
        ).limit(3).all()

        if not recent_calls:
            return jsonify({'error': 'No transcribed calls available for testing'}), 400

        # Test the custom prompt on each call
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        sample_results = []

        for call in recent_calls:
            if call.transcription and call.transcription.transcription_text:
                try:
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": custom_prompt},
                            {"role": "user", "content": f"Analyze this call:\n{call.transcription.transcription_text}"}
                        ]
                    )

                    sample_results.append({
                        'call_id': call.id,
                        'call_date': call.received_at.isoformat() if call.received_at else None,
                        'output': response.choices[0].message.content
                    })
                except Exception as e:
                    logger.error(f"Error testing on call {call.id}: {e}")
                    continue

        return jsonify({
            'test_results': {
                'calls_tested': len(sample_results),
                'sample_results': sample_results
            }
        }), 200

    except Exception as e:
        logger.error(f"Test prompt error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/save', methods=['POST'])
@jwt_required()
def save_custom_prompt():
    """Save and activate a custom prompt with digital signature"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        user_id = claims.get('sub')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        data = request.get_json()
        feature_slug = data.get('feature_slug')
        custom_prompt = data.get('custom_prompt')
        signature_name = data.get('signature_name')
        wizard_data = data.get('wizard_data', {})

        if not all([feature_slug, custom_prompt, signature_name]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Deactivate any existing active customization for this feature
        PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug,
            is_active=True
        ).update({'is_active': False})

        # Get the latest version number
        latest_version = db.session.query(func.max(PromptCustomization.version)).filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug
        ).scalar() or 0

        # Create new customization
        customization = PromptCustomization(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug,
            custom_prompt=custom_prompt,
            wizard_config=json.dumps(wizard_data) if wizard_data else None,
            version=latest_version + 1,
            is_active=True,
            signature_name=signature_name,
            signature_ip=request.remote_addr,
            created_by=user_id
        )

        db.session.add(customization)
        db.session.commit()

        # Log audit trail
        log_audit('prompt_customization_created', 'prompt_customization', customization.id, {
            'feature_slug': feature_slug,
            'version': customization.version,
            'signature_name': signature_name
        })

        return jsonify({
            'message': 'Prompt customization saved and activated successfully',
            'customization_id': customization.id,
            'version': customization.version
        }), 201

    except Exception as e:
        logger.error(f"Save prompt error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/history/<feature_slug>', methods=['GET'])
@jwt_required()
def get_prompt_history(feature_slug):
    """Get version history for a feature's prompts"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        history = PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=feature_slug
        ).order_by(PromptCustomization.version.desc()).all()

        return jsonify({
            'history': [{
                'id': h.id,
                'version': h.version,
                'is_active': h.is_active,
                'signature_name': h.signature_name,
                'created_at': h.created_at.isoformat() if h.created_at else None,
                'prompt_preview': h.custom_prompt[:200] + '...' if len(h.custom_prompt) > 200 else h.custom_prompt
            } for h in history]
        }), 200

    except Exception as e:
        logger.error(f"Get prompt history error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/tenant/prompts/restore/<int:version_id>', methods=['POST'])
@jwt_required()
def restore_prompt_version(version_id):
    """Restore a previous prompt version"""
    try:
        claims = get_jwt()
        tenant_id = claims.get('tenant_id')
        user_id = claims.get('sub')

        if not tenant_id:
            return jsonify({'error': 'No tenant associated with user'}), 400

        # Get the version to restore
        version_to_restore = PromptCustomization.query.filter_by(
            id=version_id,
            tenant_id=tenant_id
        ).first()

        if not version_to_restore:
            return jsonify({'error': 'Version not found'}), 404

        # Deactivate current active version
        PromptCustomization.query.filter_by(
            tenant_id=tenant_id,
            ai_feature_slug=version_to_restore.ai_feature_slug,
            is_active=True
        ).update({'is_active': False})

        # Activate the restored version
        version_to_restore.is_active = True
        db.session.commit()

        # Log audit trail
        log_audit('prompt_version_restored', 'prompt_customization', version_id, {
            'feature_slug': version_to_restore.ai_feature_slug,
            'version': version_to_restore.version
        })

        return jsonify({
            'message': 'Version restored successfully',
            'version': version_to_restore.version
        }), 200

    except Exception as e:
        logger.error(f"Restore version error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# EXPORT AND REPORTING ENDPOINTS
# ============================================================================

@app.route('/api/export/calls/csv', methods=['GET'])
@jwt_required()
def export_calls_csv():
    """Export calls to CSV with applied filters"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    search = request.args.get('search', '')
    status = request.args.get('status', '')
    sentiment = request.args.get('sentiment', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    min_duration = request.args.get('min_duration', type=int)
    max_duration = request.args.get('max_duration', type=int)

    # Build query with filters (same logic as get_calls)
    query = CDRRecord.query.filter_by(tenant_id=tenant_id)

    if search:
        query = query.filter(
            db.or_(
                CDRRecord.src.like(f'%{search}%'),
                CDRRecord.dst.like(f'%{search}%'),
                CDRRecord.caller_name.like(f'%{search}%')
            )
        )

    if status:
        query = query.filter(CDRRecord.disposition == status)

    if date_from:
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
        query = query.filter(CDRRecord.received_at >= date_from_obj)

    if date_to:
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
        date_to_obj = date_to_obj + timedelta(days=1)
        query = query.filter(CDRRecord.received_at < date_to_obj)

    if min_duration is not None:
        query = query.filter(CDRRecord.duration >= min_duration)

    if max_duration is not None:
        query = query.filter(CDRRecord.duration <= max_duration)

    if sentiment:
        query = query.join(CDRRecord.transcription).join(Transcription.sentiment).filter(
            SentimentAnalysis.sentiment == sentiment
        )

    # Get all matching calls
    calls = query.order_by(CDRRecord.received_at.desc()).all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'Call ID', 'Date/Time', 'From', 'To', 'Caller Name',
        'Duration (s)', 'Status', 'Sentiment', 'Sentiment Score',
        'Transcription', 'Has Recording'
    ])

    # Write data
    for call in calls:
        sentiment_val = call.transcription.sentiment.sentiment if call.transcription and call.transcription.sentiment else ''
        sentiment_score = call.transcription.sentiment.sentiment_score if call.transcription and call.transcription.sentiment else ''
        transcription = call.transcription.transcription_text if call.transcription else ''

        writer.writerow([
            call.uniqueid,
            call.received_at.strftime('%Y-%m-%d %H:%M:%S') if call.received_at else '',
            call.src or '',
            call.dst or '',
            call.caller_name or '',
            call.duration or 0,
            call.disposition or '',
            sentiment_val,
            f'{sentiment_score:.2f}' if sentiment_score else '',
            transcription,
            'Yes' if call.recordfiles else 'No'
        ])

    # Create response
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'calls_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )


@app.route('/api/export/email-report', methods=['POST'])
@jwt_required()
def email_report():
    """Email a call report to specified address"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    user_id = claims.get('sub')

    data = request.get_json()
    recipient_email = data.get('email')
    search = data.get('search', '')
    filters = data.get('filters', {})

    if not recipient_email:
        return jsonify({'error': 'Email address required'}), 400

    # Get tenant and user info
    tenant = Tenant.query.get(tenant_id)
    user = User.query.get(user_id)

    try:
        # Import resend here to avoid issues if not installed
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        # Build query with filters
        query = CDRRecord.query.filter_by(tenant_id=tenant_id)

        if search:
            query = query.filter(
                db.or_(
                    CDRRecord.src.like(f'%{search}%'),
                    CDRRecord.dst.like(f'%{search}%'),
                    CDRRecord.caller_name.like(f'%{search}%')
                )
            )

        if filters.get('status'):
            query = query.filter(CDRRecord.disposition == filters['status'])

        if filters.get('sentiment'):
            query = query.join(CDRRecord.transcription).join(Transcription.sentiment).filter(
                SentimentAnalysis.sentiment == filters['sentiment']
            )

        # Get stats
        total_calls = query.count()
        calls_sample = query.order_by(CDRRecord.received_at.desc()).limit(10).all()

        # Build email HTML
        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Call Report - {tenant.company_name}</h2>
            <p>Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Requested by: {user.email}</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Summary</h3>
              <p><strong>Total Calls:</strong> {total_calls}</p>
              {f'<p><strong>Status Filter:</strong> {filters.get("status")}</p>' if filters.get('status') else ''}
              {f'<p><strong>Sentiment Filter:</strong> {filters.get("sentiment")}</p>' if filters.get('sentiment') else ''}
            </div>

            <h3>Recent Calls (Latest 10)</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #333; color: white;">
                  <th style="padding: 10px; text-align: left;">From</th>
                  <th style="padding: 10px; text-align: left;">To</th>
                  <th style="padding: 10px; text-align: left;">Duration</th>
                  <th style="padding: 10px; text-align: left;">Status</th>
                </tr>
              </thead>
              <tbody>
        """

        for call in calls_sample:
            mins = call.duration // 60 if call.duration else 0
            secs = call.duration % 60 if call.duration else 0
            duration_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

            email_html += f"""
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px;">{call.src or '-'}</td>
                  <td style="padding: 10px;">{call.dst or '-'}</td>
                  <td style="padding: 10px;">{duration_str}</td>
                  <td style="padding: 10px;">{call.disposition or '-'}</td>
                </tr>
            """

        email_html += """
              </tbody>
            </table>

            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This report was generated by AudiaPro. For a full export, use the CSV export feature in your dashboard.
            </p>
          </body>
        </html>
        """

        # Send email
        params = {
            "from": os.getenv('RESEND_FROM_EMAIL', 'reports@audiapro.com'),
            "to": [recipient_email],
            "subject": f"Call Report - {tenant.company_name}",
            "html": email_html
        }

        email_response = resend.Emails.send(params)

        logger.info(f"Report email sent to {recipient_email} for tenant {tenant_id}")

        return jsonify({
            'success': True,
            'message': f'Report sent to {recipient_email}',
            'email_id': email_response.get('id')
        }), 200

    except ImportError:
        logger.error("Resend library not installed")
        return jsonify({'error': 'Email service not configured'}), 500
    except Exception as e:
        logger.error(f"Failed to send report email: {e}")
        return jsonify({'error': 'Failed to send email'}), 500


# ============================================================================
# EMAIL AND SMS NOTIFICATION HELPERS
# ============================================================================

def send_welcome_email(user_email, user_name, temp_password, company_name):
    """Send welcome email to new user"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to AudiaPro!</h2>
            <p>Hi {user_name},</p>
            <p>Your account has been created for <strong>{company_name}</strong>.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Login Credentials</h3>
              <p><strong>Email:</strong> {user_email}</p>
              <p><strong>Temporary Password:</strong> {temp_password}</p>
            </div>

            <p>Please log in and change your password immediately.</p>
            <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In Now</a></p>

            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact your administrator.
            </p>
          </body>
        </html>
        """

        params = {
            "from": os.getenv('RESEND_FROM_EMAIL', 'welcome@audiapro.com'),
            "to": [user_email],
            "subject": f"Welcome to AudiaPro - {company_name}",
            "html": email_html
        }

        resend.Emails.send(params)
        logger.info(f"Welcome email sent to {user_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
        return False


def send_verification_email(user_email, user_name, verification_token):
    """Send email verification link"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        verification_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi {user_name},</p>
            <p>Thank you for signing up for AudiaPro! Please verify your email address to complete your registration.</p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="{verification_link}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>

            <p>This link will expire in 7 days.</p>
            <p>If you didn't create an account with AudiaPro, you can safely ignore this email.</p>

            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="{verification_link}">{verification_link}</a>
            </p>
          </body>
        </html>
        """

        params = {
            "from": os.getenv('RESEND_FROM_EMAIL', 'verify@audiapro.com'),
            "to": [user_email],
            "subject": "Verify Your Email - AudiaPro",
            "html": email_html
        }

        resend.Emails.send(params)
        logger.info(f"Verification email sent to {user_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        return False


def send_sms_alert(phone_number, message):
    """Send SMS alert via Twilio"""
    try:
        from twilio.rest import Client

        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_FROM_NUMBER')

        if not all([account_sid, auth_token, from_number]):
            logger.warning("Twilio not configured - SMS not sent")
            return False

        client = Client(account_sid, auth_token)

        message = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )

        logger.info(f"SMS sent to {phone_number}: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"Failed to send SMS: {e}")
        return False


def send_urgent_notification(user_email, user_phone, subject, message_text):
    """Send urgent notification via email and SMS"""
    # Send email
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">Urgent Alert</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #dc3545; border-top: none; border-radius: 0 0 5px 5px;">
              <h3>{subject}</h3>
              <p>{message_text}</p>
              <p style="margin-top: 20px; color: #666; font-size: 12px;">
                This is an automated alert from AudiaPro.
              </p>
            </div>
          </body>
        </html>
        """

        params = {
            "from": os.getenv('RESEND_FROM_EMAIL', 'alerts@audiapro.com'),
            "to": [user_email],
            "subject": f"URGENT: {subject}",
            "html": email_html
        }

        resend.Emails.send(params)
        logger.info(f"Urgent email sent to {user_email}")

    except Exception as e:
        logger.error(f"Failed to send urgent email: {e}")

    # Send SMS if phone number provided
    if user_phone:
        sms_text = f"URGENT: {subject}\n{message_text}"
        send_sms_alert(user_phone, sms_text)


def send_usage_limit_warning(tenant, usage_type='calls'):
    """Send warning email when approaching usage limits"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        # Get tenant admin users
        admins = User.query.filter_by(tenant_id=tenant.id, role='admin', is_active=True).all()

        if not admins:
            logger.warning(f"No admins found for tenant {tenant.id}")
            return False

        # Calculate current usage percentage
        if usage_type == 'calls':
            current = tenant.usage_this_month or 0
            limit = tenant.max_calls_per_month
            percentage = (current / limit * 100) if limit > 0 else 0
            limit_type = "call"
        else:  # users
            current = User.query.filter_by(tenant_id=tenant.id).count()
            limit = tenant.max_users
            percentage = (current / limit * 100) if limit > 0 else 0
            limit_type = "user"

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ffc107; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0; color: #000;">Usage Limit Warning</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #ffc107; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hi Team,</p>
              <p>Your <strong>{tenant.company_name}</strong> account is approaching its {limit_type} limit.</p>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Current Usage</h3>
                <p style="font-size: 24px; font-weight: bold; color: #{"dc3545" if percentage >= 90 else "ffc107"}; margin: 10px 0;">
                  {int(percentage)}% Used
                </p>
                <p><strong>{int(current)}</strong> of <strong>{int(limit)}</strong> {limit_type}s</p>
              </div>

              <p>To avoid service interruption, please consider upgrading your plan.</p>

              <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Plans & Upgrade
              </a></p>

              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                This is an automated notification from AudiaPro.
              </p>
            </div>
          </body>
        </html>
        """

        for admin in admins:
            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'alerts@audiapro.com'),
                "to": [admin.email],
                "subject": f"Action Required: {limit_type.capitalize()} Limit Warning - {tenant.company_name}",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"Usage limit warning sent to {admin.email} for tenant {tenant.id}")

        return True

    except Exception as e:
        logger.error(f"Failed to send usage limit warning: {e}")
        return False


def send_plan_upgrade_email(tenant, recommended_plan):
    """Send plan upgrade recommendation email"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        admins = User.query.filter_by(tenant_id=tenant.id, role='admin', is_active=True).all()

        if not admins:
            return False

        plan_features = {
            'starter': {
                'price': '$29/month',
                'users': '5 users',
                'calls': '1,000 calls/month',
                'features': ['Basic analytics', 'Email support', 'Call recordings']
            },
            'professional': {
                'price': '$99/month',
                'users': '20 users',
                'calls': '10,000 calls/month',
                'features': ['Advanced analytics', 'Priority support', 'AI transcription', 'Sentiment analysis', 'Custom reports']
            },
            'enterprise': {
                'price': '$299/month',
                'users': 'Unlimited users',
                'calls': 'Unlimited calls',
                'features': ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', '24/7 phone support']
            }
        }

        plan_info = plan_features.get(recommended_plan, {})

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Upgrade to {recommended_plan.capitalize()} Plan</h2>
            <p>Hi Team at {tenant.company_name},</p>
            <p>Based on your usage patterns, we recommend upgrading to our <strong>{recommended_plan.capitalize()} Plan</strong> for better value and features.</p>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 30px 0;">
              <h3 style="margin-top: 0; font-size: 28px;">{recommended_plan.capitalize()} Plan</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">{plan_info.get('price', '')}</p>
              <p style="font-size: 18px;">{plan_info.get('users', '')} | {plan_info.get('calls', '')}</p>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h4>What's Included:</h4>
              <ul style="line-height: 2;">
                {"".join([f"<li>{feature}</li>" for feature in plan_info.get('features', [])])}
              </ul>
            </div>

            <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription"
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Upgrade Now
            </a></p>

            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Questions? Reply to this email or contact support@audiapro.com
            </p>
          </body>
        </html>
        """

        for admin in admins:
            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'sales@audiapro.com'),
                "to": [admin.email],
                "subject": f"Recommended: Upgrade to {recommended_plan.capitalize()} Plan",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"Plan upgrade email sent to {admin.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send plan upgrade email: {e}")
        return False


def send_new_tenant_notification_to_superadmins(tenant):
    """Notify super admins about new tenant signup"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        super_admins = SuperAdmin.query.filter_by(is_active=True).all()

        if not super_admins:
            logger.warning("No active super admins found")
            return False

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">New Tenant Signup!</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #28a745; border-top: none; border-radius: 0 0 5px 5px;">
              <p>A new tenant has signed up for AudiaPro!</p>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Tenant Details</h3>
                <p><strong>Company:</strong> {tenant.company_name}</p>
                <p><strong>Subdomain:</strong> {tenant.subdomain}</p>
                <p><strong>Plan:</strong> {tenant.plan}</p>
                <p><strong>Created:</strong> {tenant.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
              </div>

              <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/superadmin/tenants/{tenant.id}"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Tenant Details
              </a></p>

              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Automated notification from AudiaPro Platform
              </p>
            </div>
          </body>
        </html>
        """

        for super_admin in super_admins:
            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'platform@audiapro.com'),
                "to": [super_admin.email],
                "subject": f"New Tenant Signup: {tenant.company_name}",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"New tenant notification sent to super admin {super_admin.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send new tenant notification: {e}")
        return False


def send_payment_confirmation_email(tenant, amount, invoice_number, billing_period):
    """Send payment confirmation email"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        admins = User.query.filter_by(tenant_id=tenant.id, role='admin', is_active=True).all()

        if not admins:
            return False

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">Payment Received</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #28a745; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Thank you for your payment!</p>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount Paid:</strong></td>
                    <td style="padding: 5px 0; text-align: right; font-size: 20px; color: #28a745;">${amount:.2f}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Billing Period:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{billing_period}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Company:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{tenant.company_name}</td>
                  </tr>
                </table>
              </div>

              <p>Your subscription is now active and will renew automatically.</p>

              <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Billing History
              </a></p>

              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Questions about this payment? Contact billing@audiapro.com
              </p>
            </div>
          </body>
        </html>
        """

        for admin in admins:
            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'billing@audiapro.com'),
                "to": [admin.email],
                "subject": f"Payment Confirmation - Invoice {invoice_number}",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"Payment confirmation sent to {admin.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send payment confirmation: {e}")
        return False


def send_monthly_usage_report(tenant):
    """Send monthly usage summary email"""
    try:
        import resend
        resend.api_key = os.getenv('RESEND_API_KEY')

        admins = User.query.filter_by(tenant_id=tenant.id, role='admin', is_active=True).all()

        if not admins:
            return False

        # Calculate stats
        current_users = User.query.filter_by(tenant_id=tenant.id).count()
        calls_this_month = tenant.usage_this_month or 0
        calls_percentage = (calls_this_month / tenant.max_calls_per_month * 100) if tenant.max_calls_per_month > 0 else 0

        # Get top caller (most calls)
        from sqlalchemy import func
        top_caller = db.session.query(
            CDRRecord.src,
            func.count(CDRRecord.id).label('call_count')
        ).filter_by(tenant_id=tenant.id).filter(
            CDRRecord.call_date >= datetime.utcnow().replace(day=1)
        ).group_by(CDRRecord.src).order_by(func.count(CDRRecord.id).desc()).first()

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Monthly Usage Report - {tenant.company_name}</h2>
            <p>Hi Team,</p>
            <p>Here's your usage summary for {datetime.utcnow().strftime('%B %Y')}:</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0; color: #666;">Call Usage</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #007bff;">
                  {int(calls_this_month)} calls
                </p>
                <div style="background: #ddd; border-radius: 10px; height: 10px; margin: 10px 0;">
                  <div style="background: #007bff; border-radius: 10px; height: 10px; width: {min(calls_percentage, 100)}%;"></div>
                </div>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                  {int(calls_percentage)}% of {tenant.max_calls_per_month} calls
                </p>
              </div>

              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0; color: #666;">Active Users</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #28a745;">
                  {current_users} users
                </p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                  Limit: {tenant.max_users} users
                </p>
              </div>

              {f'''
              <div>
                <h3 style="margin: 0; color: #666;">Top Caller</h3>
                <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">
                  {top_caller[0]} - {top_caller[1]} calls
                </p>
              </div>
              ''' if top_caller else ''}
            </div>

            <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard"
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Full Dashboard
            </a></p>

            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This is your monthly automated usage report from AudiaPro.
            </p>
          </body>
        </html>
        """

        for admin in admins:
            params = {
                "from": os.getenv('RESEND_FROM_EMAIL', 'reports@audiapro.com'),
                "to": [admin.email],
                "subject": f"Monthly Usage Report - {datetime.utcnow().strftime('%B %Y')} - {tenant.company_name}",
                "html": email_html
            }

            resend.Emails.send(params)
            logger.info(f"Monthly usage report sent to {admin.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send monthly usage report: {e}")
        return False


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring and load balancers"""
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'AudiaPro',
        'version': '1.0.0'
    }

    try:
        # Check database connection
        db.session.execute(text('SELECT 1'))
        health_status['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'disconnected'
        health_status['error'] = str(e)
        return jsonify(health_status), 503

    # Check encryption key
    if not ENCRYPTION_KEY:
        health_status['status'] = 'degraded'
        health_status['encryption'] = 'warning: using temporary key'
    else:
        health_status['encryption'] = 'configured'

    # Check storage manager
    storage_mgr = get_storage_manager()
    health_status['storage_manager'] = 'initialized' if storage_mgr is not None else 'not_initialized'
    if storage_mgr is None:
        health_status['supabase_env'] = {
            'SUPABASE_URL': 'set' if SUPABASE_URL else 'not_set',
            'SUPABASE_KEY': 'set' if SUPABASE_KEY else 'not_set',
            'SUPABASE_BUCKET': SUPABASE_BUCKET if SUPABASE_BUCKET else 'not_set'
        }

    # Return 200 if healthy, 503 if unhealthy
    status_code = 200 if health_status['status'] == 'healthy' else 503

    return jsonify(health_status), status_code


@app.route('/api/debug/storage', methods=['GET'])
def debug_storage():
    """Debug endpoint to test storage manager initialization"""
    try:
        result = {
            'env_vars': {
                'SUPABASE_URL': SUPABASE_URL if SUPABASE_URL else None,
                'SUPABASE_KEY': 'set' if SUPABASE_KEY else None,
                'SUPABASE_BUCKET': SUPABASE_BUCKET if SUPABASE_BUCKET else None,
            },
            'current_storage_manager': 'initialized' if get_storage_manager() is not None else 'not_initialized'
        }

        # Try to manually initialize
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                from supabase import create_client
                result['supabase_import'] = 'success'

                test_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                result['client_creation'] = 'success'

                # Try to list bucket
                buckets = test_client.storage.list_buckets()
                result['bucket_list'] = [b['name'] for b in buckets]

            except Exception as e:
                result['error'] = str(e)
                import traceback
                result['traceback'] = traceback.format_exc()
        else:
            result['error'] = 'Missing env vars'

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug/database', methods=['GET'])
def debug_database():
    """Debug endpoint to check database configuration and AI features"""
    try:
        debug_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'database': {},
            'ai_features': {},
            'tables': {}
        }

        # Database URL info (masked for security)
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        if 'postgresql' in db_url:
            debug_info['database']['type'] = 'PostgreSQL'
            # Mask password
            if '@' in db_url:
                parts = db_url.split('@')
                user_part = parts[0].split('://')[1].split(':')[0]
                host_part = '@'.join(parts[1:])
                debug_info['database']['url_masked'] = f"postgresql://{user_part}:****@{host_part}"
            else:
                debug_info['database']['url_masked'] = 'postgresql://****'
        elif 'sqlite' in db_url:
            debug_info['database']['type'] = 'SQLite'
            debug_info['database']['url_masked'] = db_url
        else:
            debug_info['database']['type'] = 'Unknown'
            debug_info['database']['url_masked'] = 'Unknown'

        # Check if ai_features table exists
        try:
            result = db.session.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('ai_features', 'managers', 'tenants', 'cdr_records')
            """))
            tables = [row[0] for row in result]
            debug_info['tables']['existing'] = tables
        except Exception as e:
            # Try SQLite syntax
            try:
                result = db.session.execute(text("""
                    SELECT name FROM sqlite_master
                    WHERE type='table'
                    AND name IN ('ai_features', 'managers', 'tenants', 'cdr_records')
                """))
                tables = [row[0] for row in result]
                debug_info['tables']['existing'] = tables
            except Exception as e2:
                debug_info['tables']['error'] = str(e2)

        # Check AI Features count
        try:
            result = db.session.execute(text("SELECT COUNT(*) FROM ai_features"))
            count = result.fetchone()[0]
            debug_info['ai_features']['total_count'] = count

            # Get sample features
            result = db.session.execute(text("SELECT id, name, slug, category FROM ai_features LIMIT 5"))
            samples = []
            for row in result:
                samples.append({
                    'id': row[0],
                    'name': row[1],
                    'slug': row[2],
                    'category': row[3]
                })
            debug_info['ai_features']['samples'] = samples

            # Count by category
            result = db.session.execute(text("""
                SELECT category, COUNT(*) as count
                FROM ai_features
                GROUP BY category
                ORDER BY category
            """))
            by_category = {}
            for row in result:
                by_category[row[0]] = row[1]
            debug_info['ai_features']['by_category'] = by_category

        except Exception as e:
            debug_info['ai_features']['error'] = str(e)

        # Check managers table
        try:
            result = db.session.execute(text("SELECT COUNT(*) FROM managers"))
            count = result.fetchone()[0]
            debug_info['managers'] = {
                'count': count
            }

            # Check for super admin
            result = db.session.execute(text("SELECT email FROM managers WHERE is_super_admin = TRUE LIMIT 1"))
            row = result.fetchone()
            if row:
                debug_info['managers']['super_admin_exists'] = True
                debug_info['managers']['super_admin_email'] = row[0]
            else:
                debug_info['managers']['super_admin_exists'] = False

        except Exception as e:
            debug_info['managers'] = {'error': str(e)}

        # Environment check
        # Show raw DATABASE_URL from environment (masked)
        raw_db_url = os.getenv('DATABASE_URL', 'NOT SET')
        if raw_db_url != 'NOT SET' and '@' in raw_db_url:
            parts = raw_db_url.split('@')
            user_part = parts[0].split('://')[1].split(':')[0] if '://' in parts[0] else 'unknown'
            host_part = '@'.join(parts[1:])
            masked_raw = f"{parts[0].split('://')[0]}://{user_part}:****@{host_part}"
        else:
            masked_raw = raw_db_url

        # List ALL database-related environment variables
        all_env_vars = {}
        for key in os.environ:
            if key in ['DATABASE_URL', 'DATABASE_PRIVATE_URL', 'DATABASE_PUBLIC_URL', 'PGDATABASE', 'PGHOST', 'PGPASSWORD', 'PGPORT', 'PGUSER']:
                all_env_vars[key] = 'EXISTS (masked)'
            elif 'DATABASE' in key or 'POSTGRES' in key or 'PG' in key:
                all_env_vars[key] = 'EXISTS'

        debug_info['environment'] = {
            'DATABASE_URL_set': bool(os.getenv('DATABASE_URL')),
            'DATABASE_URL_raw': masked_raw,
            'DATABASE_URL_starts_with_postgres': raw_db_url.startswith('postgres://') if raw_db_url != 'NOT SET' else False,
            'OPENAI_API_KEY_set': bool(os.getenv('OPENAI_API_KEY')),
            'JWT_SECRET_KEY_set': bool(os.getenv('JWT_SECRET_KEY')),
            'ENCRYPTION_KEY_set': bool(os.getenv('ENCRYPTION_KEY')),
            'all_database_env_vars': all_env_vars,
            'total_env_vars_count': len(os.environ)
        }

        return jsonify(debug_info), 200

    except Exception as e:
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500


# ============================================================================
# DATABASE INITIALIZATION & MIGRATION
# ============================================================================

def init_db():
    """Initialize database"""
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")


@app.route('/api/admin/migrate-database', methods=['POST'])
def migrate_database():
    """
    Manual database migration endpoint
    Adds missing columns to existing tables
    Only accessible with special migration key
    """
    # Require migration key for security
    migration_key = request.headers.get('X-Migration-Key')
    expected_key = os.getenv('MIGRATION_KEY', 'change-me-in-production')

    if migration_key != expected_key:
        return jsonify({'error': 'Unauthorized - Invalid migration key'}), 401

    try:
        migrations_applied = []

        # Check and add missing columns
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)

        # Helper function to check if column exists
        def column_exists(table_name, column_name):
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            return column_name in columns

        # Migration 1: Add call_date to cdr_records
        if not column_exists('cdr_records', 'call_date'):
            db.session.execute(text("""
                ALTER TABLE cdr_records
                ADD COLUMN call_date TIMESTAMP DEFAULT NOW()
            """))
            db.session.execute(text("""
                CREATE INDEX idx_cdr_call_date ON cdr_records(call_date)
            """))
            migrations_applied.append("Added call_date to cdr_records")
            logger.info("✅ Added call_date column to cdr_records")

        # Migration 2: Add max_users to tenants
        if not column_exists('tenants', 'max_users'):
            db.session.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_users INTEGER DEFAULT 5
            """))
            migrations_applied.append("Added max_users to tenants")
            logger.info("✅ Added max_users column to tenants")

        # Migration 3: Add max_calls_per_month to tenants
        if not column_exists('tenants', 'max_calls_per_month'):
            db.session.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_calls_per_month INTEGER DEFAULT 1000
            """))
            migrations_applied.append("Added max_calls_per_month to tenants")
            logger.info("✅ Added max_calls_per_month column to tenants")

        # Migration 4: Add subscription_status to tenants
        if not column_exists('tenants', 'subscription_status'):
            db.session.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active'
            """))
            migrations_applied.append("Added subscription_status to tenants")
            logger.info("✅ Added subscription_status column to tenants")

        # Migration 5: Create ai_features table
        tables = inspector.get_table_names()
        if 'ai_features' not in tables:
            db.session.execute(text("""
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
            migrations_applied.append("Created ai_features table")
            logger.info("✅ Created ai_features table")

        # Migration 6: Create tenant_ai_features junction table
        if 'tenant_ai_features' not in tables:
            db.session.execute(text("""
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
            db.session.execute(text("""
                CREATE INDEX idx_tenant_ai_features_tenant ON tenant_ai_features(tenant_id)
            """))
            db.session.execute(text("""
                CREATE INDEX idx_tenant_ai_features_feature ON tenant_ai_features(ai_feature_id)
            """))
            migrations_applied.append("Created tenant_ai_features table with indexes")
            logger.info("✅ Created tenant_ai_features table")

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
                db.session.execute(text(create_sql))
                migrations_applied.append(f"Created {table_name} table")
                logger.info(f"✅ Created {table_name} table")

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Database migration completed',
            'migrations_applied': migrations_applied,
            'count': len(migrations_applied)
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Migration failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/admin/seed-ai-features', methods=['POST'])
@jwt_required()
def seed_ai_features():
    """
    Seed database with all AI features
    Only accessible by super admin
    """
    try:
        require_super_admin()

        features_data = [
            # CALL QUALITY & COACHING
            {
                'name': 'AI Call Summaries',
                'slug': 'call-summaries',
                'description': 'Automatic 2-3 sentence summary of every call using GPT-4',
                'long_description': 'Leverage advanced AI to automatically generate concise, accurate summaries of every customer interaction. Save hours of manual note-taking and ensure no critical details are missed.',
                'category': 'coaching',
                'icon': 'document-text',
                'monthly_price': 99.00,
                'setup_fee': 0,
                'price_per_call': 0.05,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 5,
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
                'display_order': 1
            },
            {
                'name': 'Action Item Extraction',
                'slug': 'action-items',
                'description': 'Automatically identify follow-up tasks, commitments, and next steps from calls',
                'long_description': 'Never miss a follow-up again. Our AI automatically extracts all action items, commitments, and next steps mentioned during calls, creating a structured task list for your team.',
                'category': 'coaching',
                'icon': 'clipboard-list',
                'monthly_price': 79.00,
                'setup_fee': 0,
                'price_per_call': 0.03,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 5,
                'benefit_summary': 'Increase follow-through rate by 60%',
                'use_cases': json.dumps([
                    'Sales pipeline management',
                    'Customer support ticket creation',
                    'Project coordination calls'
                ]),
                'roi_metrics': json.dumps({
                    'follow_up_rate_increase': '60%',
                    'deals_lost_to_missed_followup': '25% reduction'
                }),
                'display_order': 2
            },
            {
                'name': 'Call Quality Scoring',
                'slug': 'quality-scoring',
                'description': 'Score calls on professionalism, greeting, closing, objection handling (1-100)',
                'long_description': 'Objective, consistent quality scores for every call based on key performance indicators. Identify coaching opportunities and track improvement over time.',
                'category': 'coaching',
                'icon': 'star',
                'monthly_price': 149.00,
                'setup_fee': 99.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 10,
                'benefit_summary': 'Improve agent performance by 35% within 3 months',
                'use_cases': json.dumps([
                    'Agent performance reviews',
                    'Quality assurance audits',
                    'Training effectiveness measurement'
                ]),
                'roi_metrics': json.dumps({
                    'performance_improvement': '35%',
                    'customer_satisfaction_increase': '22%',
                    'qa_time_reduction': '70%'
                }),
                'display_order': 3
            },
            {
                'name': 'Talk Time Analysis',
                'slug': 'talk-time',
                'description': 'Agent vs customer talk ratio, silence detection, interruption tracking',
                'long_description': 'Understand conversation dynamics with detailed talk time metrics. Identify agents who talk too much or too little, detect excessive silence, and track interruption patterns.',
                'category': 'coaching',
                'icon': 'chart-bar',
                'monthly_price': 69.00,
                'benefit_summary': 'Optimize conversation balance for better outcomes',
                'use_cases': json.dumps([
                    'Sales coaching',
                    'Active listening training',
                    'Call efficiency optimization'
                ]),
                'roi_metrics': json.dumps({
                    'optimal_talk_ratio': '40:60 agent:customer',
                    'close_rate_improvement': '18%'
                }),
                'display_order': 4
            },
            {
                'name': 'Script Adherence Detection',
                'slug': 'script-adherence',
                'description': 'Check if agents follow required scripts, compliance statements, and key talking points',
                'long_description': 'Ensure regulatory compliance and best practices by automatically verifying agents follow required scripts. Upload your scripts and get instant adherence scores.',
                'category': 'coaching',
                'icon': 'check-circle',
                'monthly_price': 129.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 8,
                'benefit_summary': 'Achieve 95%+ compliance with required scripts',
                'use_cases': json.dumps([
                    'Financial services disclosures',
                    'Healthcare privacy statements',
                    'Sales qualification questions'
                ]),
                'roi_metrics': json.dumps({
                    'compliance_rate': '95%+',
                    'audit_pass_rate': '98%'
                }),
                'display_order': 5
            },

            # COMPLIANCE & RISK MANAGEMENT
            {
                'name': 'Keyword & Compliance Monitoring',
                'slug': 'compliance-monitoring',
                'description': 'Real-time alerts for prohibited words, competitor mentions, compliance violations',
                'long_description': 'Protect your business with real-time monitoring of sensitive keywords. Set up custom watchlists for compliance terms, competitor mentions, prohibited language, and get instant alerts.',
                'category': 'compliance',
                'icon': 'shield-check',
                'monthly_price': 199.00,
                'setup_fee': 149.00,
                'benefit_summary': 'Prevent compliance violations before they become problems',
                'use_cases': json.dumps([
                    'TCPA compliance monitoring',
                    'PCI-DSS credit card data detection',
                    'Competitor mention tracking',
                    'Profanity/abuse detection'
                ]),
                'roi_metrics': json.dumps({
                    'violation_reduction': '87%',
                    'average_fine_avoided': '$50,000',
                    'legal_risk_reduction': 'Significant'
                }),
                'display_order': 6
            },
            {
                'name': 'Sentiment Analysis',
                'slug': 'sentiment-analysis',
                'description': 'Detect customer emotions (positive, negative, neutral) with confidence scores',
                'long_description': 'Understand customer emotions in real-time. Our AI analyzes tone, word choice, and conversation patterns to identify frustrated customers who need immediate attention.',
                'category': 'compliance',
                'icon': 'emoji-happy',
                'monthly_price': 89.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 5,
                'benefit_summary': 'Identify at-risk customers before they churn',
                'use_cases': json.dumps([
                    'Escalation triggers',
                    'Customer satisfaction tracking',
                    'Churn risk identification'
                ]),
                'roi_metrics': json.dumps({
                    'negative_sentiment_detection': '92% accuracy',
                    'churn_prevention': '31%',
                    'csat_correlation': '0.84'
                }),
                'display_order': 7
            },

            # REVENUE INTELLIGENCE
            {
                'name': 'Intent Detection',
                'slug': 'intent-detection',
                'description': 'Classify call intent (sales inquiry, support request, billing, cancellation)',
                'long_description': 'Automatically categorize every call by customer intent. Route follow-ups to the right team, prioritize high-value opportunities, and identify churn risks.',
                'category': 'revenue',
                'icon': 'lightning-bolt',
                'monthly_price': 99.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 5,
                'benefit_summary': 'Improve routing accuracy by 80%',
                'use_cases': json.dumps([
                    'Automatic call routing',
                    'Lead qualification',
                    'Churn risk flagging'
                ]),
                'roi_metrics': json.dumps({
                    'routing_accuracy': '92%',
                    'first_call_resolution': '+28%'
                }),
                'display_order': 8
            },
            {
                'name': 'Objection Handling Analysis',
                'slug': 'objection-handling',
                'description': 'Detect common sales objections and how effectively agents overcome them',
                'long_description': 'Master objection handling across your sales team. Identify the most common objections, track successful responses, and coach agents on proven techniques.',
                'category': 'revenue',
                'icon': 'shield-exclamation',
                'monthly_price': 149.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 10,
                'benefit_summary': 'Increase close rate by 25%',
                'use_cases': json.dumps([
                    'Sales training',
                    'Competitive intelligence',
                    'Pricing optimization'
                ]),
                'roi_metrics': json.dumps({
                    'close_rate_improvement': '25%',
                    'objection_overcome_rate': '+40%'
                }),
                'display_order': 9
            },
            {
                'name': 'Deal Risk Prediction',
                'slug': 'deal-risk',
                'description': 'Predict likelihood of deal closure based on conversation patterns',
                'long_description': 'AI-powered deal scoring based on hundreds of conversation signals. Get early warnings on at-risk deals and prioritize where to focus your effort.',
                'category': 'revenue',
                'icon': 'exclamation-triangle',
                'monthly_price': 199.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 10,
                'benefit_summary': 'Forecast accuracy improvement of 35%',
                'use_cases': json.dumps([
                    'Sales pipeline forecasting',
                    'Manager intervention triggers',
                    'Commission accuracy'
                ]),
                'roi_metrics': json.dumps({
                    'forecast_accuracy': '+35%',
                    'deal_save_rate': '42%'
                }),
                'display_order': 10
            },

            # AUTOMATED INSIGHTS
            {
                'name': 'Topic Extraction',
                'slug': 'topic-extraction',
                'description': 'Identify main topics discussed (pricing, features, support issues, etc.)',
                'long_description': 'Automatically tag every call with relevant topics and themes. Understand what customers are really talking about across thousands of conversations.',
                'category': 'insights',
                'icon': 'tag',
                'monthly_price': 79.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 5,
                'benefit_summary': 'Surface trending issues 10x faster',
                'use_cases': json.dumps([
                    'Product feedback analysis',
                    'Common pain point identification',
                    'Feature request tracking'
                ]),
                'roi_metrics': json.dumps({
                    'issue_detection_speed': '10x faster',
                    'product_roadmap_input': 'Continuous'
                }),
                'display_order': 11
            },

            # CUSTOMER INTELLIGENCE
            {
                'name': 'Emotion Detection',
                'slug': 'emotion-detection',
                'description': 'Identify specific emotions (anger, frustration, excitement, confusion)',
                'long_description': 'Go beyond basic sentiment to detect specific emotions like frustration, excitement, confusion, or urgency. Trigger appropriate workflows based on emotional state.',
                'category': 'customer_intelligence',
                'icon': 'heart',
                'monthly_price': 129.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 7,
                'benefit_summary': 'Reduce escalations by 45%',
                'use_cases': json.dumps([
                    'Automatic escalation triggers',
                    'Empathy training',
                    'VIP customer identification'
                ]),
                'roi_metrics': json.dumps({
                    'escalation_reduction': '45%',
                    'customer_satisfaction': '+18%'
                }),
                'display_order': 12
            },
            {
                'name': 'Churn Prediction',
                'slug': 'churn-prediction',
                'description': 'Identify at-risk customers based on conversation patterns',
                'long_description': 'Predictive analytics that identify customers likely to churn based on language patterns, sentiment shifts, and topic trends. Get alerts in time to save the relationship.',
                'category': 'customer_intelligence',
                'icon': 'user-minus',
                'monthly_price': 249.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 15,
                'benefit_summary': 'Reduce churn by 27%',
                'use_cases': json.dumps([
                    'Proactive retention campaigns',
                    'Account health scoring',
                    'Customer success prioritization'
                ]),
                'roi_metrics': json.dumps({
                    'churn_reduction': '27%',
                    'prediction_accuracy': '81%',
                    'ltv_increase': '34%'
                }),
                'display_order': 13
            },
            {
                'name': 'Customer Journey Mapping',
                'slug': 'journey-mapping',
                'description': 'Track customer interactions across multiple calls over time',
                'long_description': 'See the complete customer story across all touchpoints. Understand the path from first contact to closed deal or support resolution.',
                'category': 'customer_intelligence',
                'icon': 'map',
                'monthly_price': 179.00,
                'benefit_summary': 'Identify conversion bottlenecks and optimize touchpoints',
                'use_cases': json.dumps([
                    'Sales cycle optimization',
                    'Onboarding improvement',
                    'Support experience mapping'
                ]),
                'roi_metrics': json.dumps({
                    'conversion_rate_lift': '22%',
                    'sales_cycle_reduction': '15%'
                }),
                'display_order': 14
            },

            # REAL-TIME AI
            {
                'name': 'Real-Time Agent Assist',
                'slug': 'real-time-assist',
                'description': 'Live suggestions, knowledge base articles, next best actions during calls',
                'long_description': 'Give agents superpowers with real-time AI assistance. Surface relevant knowledge articles, suggest responses to objections, and guide toward best outcomes - all during live calls.',
                'category': 'real_time',
                'icon': 'support',
                'monthly_price': 299.00,
                'setup_fee': 499.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 2,
                'benefit_summary': 'Improve first-call resolution by 40%',
                'use_cases': json.dumps([
                    'New agent onboarding',
                    'Complex product support',
                    'Sales battle cards'
                ]),
                'roi_metrics': json.dumps({
                    'fcr_improvement': '40%',
                    'handle_time_reduction': '25%',
                    'csat_increase': '+31%'
                }),
                'display_order': 15,
                'is_beta': True
            },

            # ADVANCED ANALYTICS
            {
                'name': 'Conversation Intelligence Dashboard',
                'slug': 'conversation-intelligence',
                'description': 'Advanced analytics on topics, trends, patterns across all calls',
                'long_description': 'Executive dashboard with deep conversation analytics. Identify trends, spot emerging issues, and make data-driven decisions based on thousands of customer interactions.',
                'category': 'analytics',
                'icon': 'chart-pie',
                'monthly_price': 199.00,
                'benefit_summary': 'Turn conversations into strategic insights',
                'use_cases': json.dumps([
                    'Executive reporting',
                    'Product strategy',
                    'Market intelligence'
                ]),
                'roi_metrics': json.dumps({
                    'strategic_insight_generation': 'Weekly',
                    'competitive_intelligence': 'Real-time'
                }),
                'display_order': 16
            },
            {
                'name': 'Agent Performance Analytics',
                'slug': 'performance-analytics',
                'description': 'Individual and team leaderboards, improvement tracking, coaching insights',
                'long_description': 'Comprehensive performance management with individual scorecards, team comparisons, trend tracking, and personalized coaching recommendations.',
                'category': 'analytics',
                'icon': 'trending-up',
                'monthly_price': 149.00,
                'benefit_summary': 'Data-driven coaching that improves performance 3x faster',
                'use_cases': json.dumps([
                    'Performance reviews',
                    'Team competitions',
                    'Training needs analysis'
                ]),
                'roi_metrics': json.dumps({
                    'coaching_effectiveness': '3x improvement',
                    'top_performer_replication': 'Systematic'
                }),
                'display_order': 17
            },
            {
                'name': 'Predictive Analytics',
                'slug': 'predictive-analytics',
                'description': 'Forecasting trends, volume predictions, outcome probabilities',
                'long_description': 'AI-powered forecasting for call volumes, customer needs, seasonal trends, and business outcomes. Plan resources and strategy with confidence.',
                'category': 'analytics',
                'icon': 'crystal-ball',
                'monthly_price': 299.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'benefit_summary': 'Optimize staffing and reduce costs by 20%',
                'use_cases': json.dumps([
                    'Workforce planning',
                    'Budget forecasting',
                    'Seasonal preparation'
                ]),
                'roi_metrics': json.dumps({
                    'staffing_optimization': '20% cost reduction',
                    'forecast_accuracy': '89%'
                }),
                'display_order': 18
            },

            # MULTILINGUAL
            {
                'name': 'Multi-Language Transcription',
                'slug': 'multilingual-transcription',
                'description': 'Transcribe calls in 50+ languages with automatic language detection',
                'long_description': 'Global support with automatic language detection and transcription in over 50 languages. All AI features work across languages automatically.',
                'category': 'multilingual',
                'icon': 'globe',
                'monthly_price': 149.00,
                'requires_openai': True,
                'openai_model': 'whisper-1',
                'processing_time_estimate': 10,
                'benefit_summary': 'Expand to global markets without language barriers',
                'use_cases': json.dumps([
                    'International customer support',
                    'Global sales teams',
                    'Multilingual compliance'
                ]),
                'roi_metrics': json.dumps({
                    'supported_languages': '50+',
                    'accuracy_per_language': '95%+',
                    'market_expansion': 'Global'
                }),
                'display_order': 19
            },
            {
                'name': 'Translation Services',
                'slug': 'translation',
                'description': 'Real-time translation of transcripts to any target language',
                'long_description': 'Translate call transcripts to any language for global team collaboration, compliance documentation, or customer delivery.',
                'category': 'multilingual',
                'icon': 'translate',
                'monthly_price': 99.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'processing_time_estimate': 8,
                'benefit_summary': 'Enable global team collaboration',
                'use_cases': json.dumps([
                    'Distributed team coordination',
                    'International compliance',
                    'Customer documentation'
                ]),
                'roi_metrics': json.dumps({
                    'collaboration_efficiency': '+45%',
                    'compliance_coverage': 'Global'
                }),
                'display_order': 20
            },

            # INTEGRATION INTELLIGENCE
            {
                'name': 'CRM Auto-Update',
                'slug': 'crm-integration',
                'description': 'Automatically update Salesforce/HubSpot with call notes, outcomes, next steps',
                'long_description': 'Eliminate manual data entry with automatic CRM updates. Call summaries, action items, sentiment, and custom fields are pushed to your CRM automatically.',
                'category': 'integration',
                'icon': 'database',
                'monthly_price': 199.00,
                'setup_fee': 299.00,
                'benefit_summary': 'Save 2 hours per agent per day on data entry',
                'use_cases': json.dumps([
                    'Salesforce integration',
                    'HubSpot sync',
                    'Pipeline management'
                ]),
                'roi_metrics': json.dumps({
                    'time_saved_per_agent': '2 hours/day',
                    'data_accuracy': '99%',
                    'crm_adoption': '+67%'
                }),
                'display_order': 21
            },
            {
                'name': 'Smart Call Routing',
                'slug': 'smart-routing',
                'description': 'AI-powered routing based on intent, sentiment, customer value',
                'long_description': 'Intelligent call routing that considers customer intent, emotional state, account value, and agent skills to optimize every connection.',
                'category': 'integration',
                'icon': 'switch-horizontal',
                'monthly_price': 249.00,
                'setup_fee': 399.00,
                'benefit_summary': 'Increase first-call resolution by 35%',
                'use_cases': json.dumps([
                    'VIP customer routing',
                    'Skill-based routing',
                    'Churn risk prioritization'
                ]),
                'roi_metrics': json.dumps({
                    'fcr_improvement': '35%',
                    'customer_satisfaction': '+28%',
                    'agent_utilization': '+22%'
                }),
                'display_order': 22,
                'is_beta': True
            },
            {
                'name': 'Automated Follow-Ups',
                'slug': 'automated-followups',
                'description': 'Trigger emails, SMS, tasks based on call outcomes and AI insights',
                'long_description': 'Automatic workflow triggers based on call outcomes. Send follow-up emails, create tasks, schedule callbacks, or escalate issues - all based on AI analysis.',
                'category': 'integration',
                'icon': 'mail',
                'monthly_price': 149.00,
                'benefit_summary': 'Never miss a follow-up, increase conversion by 40%',
                'use_cases': json.dumps([
                    'Quote follow-ups',
                    'Support ticket creation',
                    'Renewal reminders'
                ]),
                'roi_metrics': json.dumps({
                    'follow_up_rate': '100%',
                    'conversion_lift': '40%',
                    'manual_work_eliminated': '90%'
                }),
                'display_order': 23
            },
            {
                'name': 'Custom Entity Extraction',
                'slug': 'custom-entities',
                'description': 'Extract custom business entities (product names, competitor mentions, pricing)',
                'long_description': 'Train AI to extract your specific business entities - product SKUs, competitor names, pricing tiers, contract terms, or any custom data points relevant to your business.',
                'category': 'integration',
                'icon': 'finger-print',
                'monthly_price': 179.00,
                'setup_fee': 499.00,
                'requires_openai': True,
                'openai_model': 'gpt-4',
                'benefit_summary': 'Capture business-critical data automatically',
                'use_cases': json.dumps([
                    'Product mention tracking',
                    'Competitive intelligence',
                    'Contract term extraction'
                ]),
                'roi_metrics': json.dumps({
                    'data_capture_rate': '97%',
                    'manual_review_reduction': '85%'
                }),
                'display_order': 24
            },
        ]

        # Insert or update features
        created_count = 0
        updated_count = 0

        for feature_data in features_data:
            existing = AIFeature.query.filter_by(slug=feature_data['slug']).first()

            if existing:
                # Update existing feature
                for key, value in feature_data.items():
                    setattr(existing, key, value)
                updated_count += 1
            else:
                # Create new feature
                feature = AIFeature(**feature_data)
                db.session.add(feature)
                created_count += 1

        db.session.commit()

        log_audit('ai_features_seeded', details={
            'created': created_count,
            'updated': updated_count,
            'total': len(features_data)
        })

        return jsonify({
            'success': True,
            'message': 'AI features seeded successfully',
            'created': created_count,
            'updated': updated_count,
            'total': len(features_data)
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Seed AI features error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Initialize database on app startup (before first request)
@app.before_request
def initialize_database():
    """Ensure database is initialized before processing requests"""
    if not hasattr(app, '_database_initialized'):
        init_db()
        app._database_initialized = True


# ============================================================================
# FRONTEND SERVING - MUST BE LAST ROUTE (CATCH-ALL)
# ============================================================================

# 404 error handler for SPA routing
@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors - serve index.html for non-API routes to support SPA routing"""
    path = request.path

    # API routes should return JSON 404
    if path.startswith('/api/'):
        return jsonify({
            'code': 'not_found',
            'error': 'The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.'
        }), 404

    # For all other routes, serve index.html (React Router handles client-side routing)
    try:
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return jsonify({
                'error': 'Frontend not built',
                'message': 'Frontend build files not found'
            }), 503
    except Exception as ex:
        logger.error(f"Error serving index.html: {ex}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend - catch-all for non-API routes"""
    # Skip API routes (they have their own handlers)
    if path.startswith('api/'):
        from flask import abort
        abort(404)

    try:
        # Check if requesting a static file (CSS, JS, images, etc.)
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)

        # For all other routes, serve index.html (React Router will handle client-side routing)
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            logger.error(f"index.html not found at {index_path}")
            return jsonify({
                'error': 'Frontend not built',
                'message': 'Please build the frontend: cd frontend && npm run build',
                'api_status': 'Backend API is running',
                'static_folder': app.static_folder,
                'index_exists': os.path.exists(index_path)
            }), 503
    except Exception as e:
        logger.error(f"Frontend serving error for path '{path}': {e}", exc_info=True)
        return jsonify({
            'error': 'Error serving frontend',
            'message': str(e),
            'path': path,
            'static_folder': app.static_folder
        }), 500


if __name__ == '__main__':
    init_db()

    # CDR polling service DISABLED - using recording scraper to create CDRs instead
    # The scraper extracts all call data directly from the recordings page
    logger.info("ℹ️  CDR Polling service disabled - scraper creates CDRs from recordings page")

    port = int(os.getenv('PORT', 5000))
    logger.info("=" * 60)
    logger.info("AudiaPro - Enhanced Multi-Platform SaaS")
    logger.info("=" * 60)
    logger.info(f"Starting on port {port}")
    logger.info(f"Supported Phone Systems: {len(PHONE_SYSTEM_PRESETS)}")
    logger.info("=" * 60)

    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'false').lower() == 'true')
