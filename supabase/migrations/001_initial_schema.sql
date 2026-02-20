-- AudiaPro Initial Schema Migration
-- Creates all tables with proper constraints and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),

    -- Billing
    billing_email TEXT,
    billing_plan TEXT DEFAULT 'free' CHECK (billing_plan IN ('free', 'starter', 'professional', 'enterprise')),

    -- Usage tracking
    calls_processed_total INTEGER DEFAULT 0,
    audio_minutes_total INTEGER DEFAULT 0,
    storage_bytes_total BIGINT DEFAULT 0,

    -- AI customization
    ai_custom_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'tenant_admin', 'manager', 'viewer')),

    -- Preferences
    timezone TEXT DEFAULT 'UTC',
    email_notifications_enabled BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- PBX CONNECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pbx_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    connection_type TEXT NOT NULL DEFAULT 'grandstream' CHECK (connection_type IN ('grandstream', 'generic')),

    -- Connection details
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 8089,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted
    verify_ssl BOOLEAN DEFAULT FALSE,

    -- Webhook
    webhook_secret TEXT NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_connected_at TIMESTAMPTZ,
    last_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_pbx_connections_tenant_id ON pbx_connections(tenant_id);
CREATE INDEX idx_pbx_connections_status ON pbx_connections(status);

-- ============================================
-- CDR RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cdr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pbx_connection_id UUID NOT NULL REFERENCES pbx_connections(id) ON DELETE CASCADE,

    -- Call identifiers
    uniqueid TEXT NOT NULL,
    linkedid TEXT,
    session TEXT,
    callid TEXT,

    -- Call details
    src TEXT NOT NULL,
    dst TEXT NOT NULL,
    call_direction TEXT NOT NULL CHECK (call_direction IN ('inbound', 'outbound', 'internal')),
    dcontext TEXT,
    channel TEXT,
    dstchannel TEXT,

    -- Timing
    start_time TIMESTAMPTZ,
    answer_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    billsec_seconds INTEGER,

    -- Status
    disposition TEXT NOT NULL CHECK (disposition IN ('ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED', 'CONGESTION')),
    amaflags TEXT,

    -- Recording
    recording_filename TEXT,
    recording_storage_path TEXT,
    recording_size_bytes INTEGER,

    -- Transcription
    transcript_storage_path TEXT,
    transcript_text_storage_path TEXT,
    transcript_word_count INTEGER,
    transcript_confidence REAL,
    speaker_count INTEGER,

    -- AI Analysis
    analysis_storage_path TEXT,

    -- Additional CDR fields
    lastapp TEXT,
    lastdata TEXT,
    accountcode TEXT,
    userfield TEXT,
    did TEXT,
    outbound_cnum TEXT,
    outbound_cnam TEXT,
    dst_cnam TEXT,
    peeraccount TEXT,
    sequence TEXT,
    src_trunk_name TEXT,
    dst_trunk_name TEXT,
    clid TEXT,

    -- Processing status
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    completed_at TIMESTAMPTZ,

    -- Raw webhook payload (for debugging)
    raw_webhook_payload JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_cdr_records_tenant_id ON cdr_records(tenant_id);
CREATE INDEX idx_cdr_records_pbx_connection_id ON cdr_records(pbx_connection_id);
CREATE INDEX idx_cdr_records_uniqueid ON cdr_records(uniqueid);
CREATE INDEX idx_cdr_records_src ON cdr_records(src);
CREATE INDEX idx_cdr_records_dst ON cdr_records(dst);
CREATE INDEX idx_cdr_records_call_direction ON cdr_records(call_direction);
CREATE INDEX idx_cdr_records_disposition ON cdr_records(disposition);
CREATE INDEX idx_cdr_records_start_time ON cdr_records(start_time DESC);
CREATE INDEX idx_cdr_records_processing_status ON cdr_records(processing_status);

-- ============================================
-- CALL ANALYSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cdr_record_id UUID NOT NULL REFERENCES cdr_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Summary
    summary TEXT,

    -- Sentiment
    sentiment_overall TEXT CHECK (sentiment_overall IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_score REAL,
    sentiment_timeline JSONB,

    -- Talk metrics
    talk_ratio_caller REAL,
    talk_ratio_agent REAL,
    talk_time_caller_seconds INTEGER,
    talk_time_agent_seconds INTEGER,
    silence_seconds INTEGER,

    -- Keywords and topics
    keywords JSONB,
    topics JSONB,

    -- Action items
    action_items JSONB,

    -- Disposition and compliance
    call_disposition_ai TEXT,
    compliance_score REAL,
    compliance_flags JSONB,

    -- Escalation risk
    escalation_risk TEXT CHECK (escalation_risk IN ('low', 'medium', 'high')),
    escalation_reasons TEXT[],

    -- Satisfaction
    satisfaction_prediction TEXT CHECK (satisfaction_prediction IN ('satisfied', 'neutral', 'dissatisfied')),
    satisfaction_score REAL,

    -- Questions and objections
    questions_asked JSONB,
    objections JSONB,

    -- Custom keyword matches
    custom_keyword_matches JSONB,

    -- Storage path
    analysis_storage_path TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_call_analyses_cdr_record_id ON call_analyses(cdr_record_id);
CREATE INDEX idx_call_analyses_tenant_id ON call_analyses(tenant_id);
CREATE INDEX idx_call_analyses_sentiment_overall ON call_analyses(sentiment_overall);
CREATE INDEX idx_call_analyses_escalation_risk ON call_analyses(escalation_risk);

-- ============================================
-- JOB QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cdr_record_id UUID NOT NULL REFERENCES cdr_records(id) ON DELETE CASCADE,

    -- Job details
    job_type TEXT NOT NULL DEFAULT 'full_pipeline' CHECK (job_type IN ('full_pipeline', 'transcribe_only', 'analyze_only')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 0,

    -- Processing
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),

    -- Error tracking
    error TEXT,

    -- Results
    result JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_queue_tenant_id ON job_queue(tenant_id);
CREATE INDEX idx_job_queue_cdr_record_id ON job_queue(cdr_record_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_scheduled_for ON job_queue(scheduled_for);
CREATE INDEX idx_job_queue_created_at ON job_queue(created_at DESC);

-- Index for atomic job claiming (partial index on pending jobs only)
CREATE INDEX idx_job_queue_claimable ON job_queue(priority DESC, created_at ASC)
WHERE status = 'pending';

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pbx_connections_updated_at BEFORE UPDATE ON pbx_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cdr_records_updated_at BEFORE UPDATE ON cdr_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_analyses_updated_at BEFORE UPDATE ON call_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_queue_updated_at BEFORE UPDATE ON job_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to claim next available job atomically
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS SETOF job_queue AS $$
DECLARE
    claimed_job job_queue;
BEGIN
    UPDATE job_queue
    SET
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = (
        SELECT id
        FROM job_queue
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING * INTO claimed_job;

    IF claimed_job.id IS NOT NULL THEN
        RETURN NEXT claimed_job;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to increment tenant usage counters atomically
CREATE OR REPLACE FUNCTION increment_tenant_usage(
    p_tenant_id UUID,
    p_calls_processed INTEGER DEFAULT 0,
    p_audio_minutes INTEGER DEFAULT 0,
    p_storage_bytes BIGINT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE tenants
    SET
        calls_processed_total = calls_processed_total + p_calls_processed,
        audio_minutes_total = audio_minutes_total + p_audio_minutes,
        storage_bytes_total = storage_bytes_total + p_storage_bytes,
        updated_at = NOW()
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
