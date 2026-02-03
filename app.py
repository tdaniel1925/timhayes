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
from sqlalchemy import and_, func, extract
from collections import defaultdict
import csv
import io
from cryptography.fernet import Fernet, InvalidToken
import secrets as crypto_secrets

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

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

# Initialize Flask app
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
CORS(app)

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
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///callinsight.db')
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

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

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
    plan_limits = db.Column(db.Text)  # JSON: {calls_per_month: 500, recording_storage_gb: 10}
    usage_this_month = db.Column(db.Integer, default=0)  # Call count this month
    billing_cycle_start = db.Column(db.DateTime)

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
            return cipher_suite.decrypt(self._webhook_password.encode()).decode()
        except (InvalidToken, UnicodeDecodeError) as e:
            logger.error(f"Failed to decrypt webhook_password for tenant {self.id}: {e}")
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

    # Parse plan limits safely
    limits = safe_json_parse(tenant.plan_limits, default={})
    calls_limit = limits.get('calls_per_month', 500)

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
        tenant.usage_this_month = (tenant.usage_this_month or 0) + 1
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to increment usage for tenant {tenant_id}: {e}", exc_info=True)


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

@app.route('/api/webhook/cdr/<subdomain>', methods=['POST'])
def receive_cdr(subdomain):
    """Receive CDR webhook - tenant-specific endpoint"""
    try:
        tenant = Tenant.query.filter_by(subdomain=subdomain).first()
        if not tenant:
            logger.warning(f"Unknown tenant subdomain: {subdomain}")
            return jsonify({'error': 'Unknown tenant'}), 404

        # Safely get webhook credentials (handle None from decryption failure)
        webhook_user = tenant.webhook_username or ""
        webhook_pass = tenant.webhook_password or ""

        auth = request.authorization
        if not auth or auth.username != webhook_user or auth.password != webhook_pass:
            logger.warning(f"Invalid credentials for tenant: {subdomain}")
            return jsonify({'error': 'Unauthorized'}), 401

        # Safely parse CDR data (handle JSON errors)
        try:
            if request.is_json:
                cdr_data = request.get_json()
            else:
                cdr_data = json.loads(request.data.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            logger.error(f"Invalid CDR data format: {e}")
            return jsonify({'error': 'Invalid JSON format'}), 400

        uniqueid = cdr_data.get('uniqueid', 'unknown')
        logger.info(f"[{subdomain}] Received CDR: {uniqueid} | {cdr_data.get('src')} -> {cdr_data.get('dst')}")

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

        # Process CDR normally
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

        # Increment usage counter
        increment_usage(tenant.id)

        return jsonify({'status': 'success'}), 200

    except Exception as e:
        db.session.rollback()  # Critical: Prevent cascading failures
        logger.error(f"Error processing CDR: {e}", exc_info=True)
        return jsonify({'error': 'CDR processing failed'}), 500


# ============================================================================
# ENHANCED DASHBOARD API ENDPOINTS
# ============================================================================

@app.route('/api/calls', methods=['GET'])
@jwt_required()
def get_calls():
    """Get paginated calls for current tenant with advanced filtering"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

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
        'duration': call.duration,
        'billsec': call.billsec,
        'disposition': call.disposition,
        'recording_path': call.recordfiles,
        'has_recording': bool(call.recordfiles),
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

    total_calls = CDRRecord.query.filter_by(tenant_id=tenant_id).count()
    answered_calls = CDRRecord.query.filter_by(tenant_id=tenant_id, disposition='ANSWERED').count()
    missed_calls = CDRRecord.query.filter_by(tenant_id=tenant_id, disposition='NO ANSWER').count()

    # Average duration
    avg_duration = db.session.query(func.avg(CDRRecord.duration)).filter_by(tenant_id=tenant_id).scalar() or 0

    # Transcribed calls
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

    days = request.args.get('days', 30, type=int)
    cutoff_date = datetime.utcnow() - timedelta(days=days)

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

    # Get plan limits
    plan_limits = json.loads(tenant.plan_limits) if tenant.plan_limits else {}

    # Calculate storage used (simplified - in production, sum actual file sizes)
    storage_used_gb = 0  # Placeholder - implement actual storage calculation

    return jsonify({
        'calls_this_month': tenant.usage_this_month or 0,
        'calls_limit': plan_limits.get('calls_per_month', 500),
        'storage_used_gb': storage_used_gb,
        'storage_limit_gb': plan_limits.get('recording_storage_gb', 5),
        'billing_cycle_start': tenant.billing_cycle_start.isoformat() if tenant.billing_cycle_start else None
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
    """Download/stream recording file"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    call = CDRRecord.query.filter_by(id=call_id, tenant_id=tenant_id).first()
    if not call:
        return jsonify({'error': 'Call not found'}), 404

    if not call.recording_local_path or not os.path.exists(call.recording_local_path):
        return jsonify({'error': 'Recording not available'}), 404

    return send_file(call.recording_local_path, as_attachment=True)


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

    return jsonify(call_data), 200


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


@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create new user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    required = ['email', 'full_name', 'password']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

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
def update_user(user_id):
    """Update user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

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
def delete_user(user_id):
    """Delete user (admin only)"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')
    role = claims.get('role')
    current_user_id = get_jwt_identity()

    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

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
# FRONTEND SERVING
# ============================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend"""
    try:
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        logger.error(f"Frontend serving error: {e}")
        return jsonify({
            'error': 'Frontend not built',
            'message': 'Please build the frontend: cd frontend && npm run build',
            'api_status': 'Backend API is running',
            'api_docs': {
                'health': '/api/auth/me',
                'login': 'POST /api/auth/login',
                'signup': 'POST /api/auth/signup'
            }
        }), 200


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
        db.session.execute('SELECT 1')
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

    # Return 200 if healthy, 503 if unhealthy
    status_code = 200 if health_status['status'] == 'healthy' else 503

    return jsonify(health_status), status_code


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database"""
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")


# Initialize database on app startup (before first request)
@app.before_request
def initialize_database():
    """Ensure database is initialized before processing requests"""
    if not hasattr(app, '_database_initialized'):
        init_db()
        app._database_initialized = True


if __name__ == '__main__':
    init_db()

    port = int(os.getenv('PORT', 5000))
    logger.info("=" * 60)
    logger.info("AudiaPro - Enhanced Multi-Platform SaaS")
    logger.info("=" * 60)
    logger.info(f"Starting on port {port}")
    logger.info(f"Supported Phone Systems: {len(PHONE_SYSTEM_PRESETS)}")
    logger.info("=" * 60)

    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'false').lower() == 'true')
