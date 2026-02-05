"""
Super Admin Business Management Models
These models enable complete SaaS business operation and monitoring
"""

# Add these to app.py after TenantAIFeature model (line 877)

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


# These models should be added to app.py after line 877 (after TenantAIFeature model)
