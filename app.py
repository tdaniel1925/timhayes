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

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///callinsight.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure recording directory exists
RECORDING_DIR = os.getenv('RECORDING_DIR', './recordings')
Path(RECORDING_DIR).mkdir(parents=True, exist_ok=True)

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
    phone_system_type = db.Column(db.String(50), default='grandstream_ucm')  # New field
    pbx_ip = db.Column(db.String(200))
    pbx_username = db.Column(db.String(100))
    pbx_password = db.Column(db.String(200))
    pbx_port = db.Column(db.Integer, default=8443)

    # Webhook credentials
    webhook_username = db.Column(db.String(100))
    webhook_password = db.Column(db.String(200))

    # Features
    transcription_enabled = db.Column(db.Boolean, default=True)
    sentiment_enabled = db.Column(db.Boolean, default=True)

    # Subscription
    plan = db.Column(db.String(50), default='starter')
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    users = db.relationship('User', backref='tenant', lazy=True, cascade='all, delete-orphan')
    cdr_records = db.relationship('CDRRecord', backref='tenant', lazy=True, cascade='all, delete-orphan')


class User(db.Model):
    """User accounts - belongs to a tenant"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)

    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(200))

    role = db.Column(db.String(50), default='user')
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))


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
    payment_id = db.Column(db.String(200))  # Stripe payment intent ID

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


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register new tenant and admin user"""
    data = request.get_json()

    required_fields = ['company_name', 'email', 'password', 'full_name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    subdomain = data['company_name'].lower().replace(' ', '-').replace('_', '-')
    base_subdomain = subdomain
    counter = 1
    while Tenant.query.filter_by(subdomain=subdomain).first():
        subdomain = f"{base_subdomain}-{counter}"
        counter += 1

    try:
        tenant = Tenant(
            company_name=data['company_name'],
            subdomain=subdomain,
            plan=data.get('plan', 'starter'),
            phone_system_type=data.get('phone_system_type', 'grandstream_ucm')
        )
        db.session.add(tenant)
        db.session.flush()

        user = User(
            tenant_id=tenant.id,
            email=data['email'],
            full_name=data['full_name'],
            role='admin'
        )
        user.set_password(data['password'])
        db.session.add(user)

        db.session.commit()

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
                'tenant': {
                    'id': tenant.id,
                    'company_name': tenant.company_name,
                    'subdomain': subdomain,
                    'plan': tenant.plan
                }
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Signup error: {e}", exc_info=True)
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
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

        auth = request.authorization
        if not auth or auth.username != tenant.webhook_username or auth.password != tenant.webhook_password:
            logger.warning(f"Invalid credentials for tenant: {subdomain}")
            return jsonify({'error': 'Unauthorized'}), 401

        if request.is_json:
            cdr_data = request.get_json()
        else:
            cdr_data = json.loads(request.data.decode('utf-8'))

        uniqueid = cdr_data.get('uniqueid', 'unknown')
        logger.info(f"[{subdomain}] Received CDR: {uniqueid} | {cdr_data.get('src')} -> {cdr_data.get('dst')}")

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

        return jsonify({'status': 'success'}), 200

    except Exception as e:
        logger.error(f"Error processing CDR: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ENHANCED DASHBOARD API ENDPOINTS
# ============================================================================

@app.route('/api/calls', methods=['GET'])
@jwt_required()
def get_calls():
    """Get paginated calls for current tenant"""
    claims = get_jwt()
    tenant_id = claims.get('tenant_id')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '')

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
def process_payment(request_id):
    """Process payment for setup request"""
    setup_request = SetupRequest.query.filter_by(request_id=request_id).first()

    if not setup_request:
        return jsonify({'error': 'Setup request not found'}), 404

    data = request.get_json()

    try:
        # In production, integrate with Stripe here
        # For now, simulate successful payment
        import uuid
        payment_id = f"pi_{uuid.uuid4().hex[:24]}"

        setup_request.payment_status = 'completed'
        setup_request.payment_id = payment_id
        setup_request.status = 'payment_received'

        db.session.commit()

        logger.info(f"Payment processed for setup request {request_id}")

        return jsonify({
            'payment_id': payment_id,
            'status': 'completed',
            'message': 'Payment processed successfully'
        }), 200

    except Exception as e:
        logger.error(f"Payment error: {e}", exc_info=True)
        return jsonify({'error': 'Payment processing failed'}), 500


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
