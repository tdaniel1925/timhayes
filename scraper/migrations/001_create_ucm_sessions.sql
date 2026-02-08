-- Create ucm_sessions table for storing UCM login sessions
-- This allows the scraper to bypass reCAPTCHA by reusing saved sessions

CREATE TABLE IF NOT EXISTS ucm_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    ucm_url TEXT NOT NULL,
    session_data JSONB NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups by tenant_id
CREATE INDEX IF NOT EXISTS idx_ucm_sessions_tenant_id ON ucm_sessions(tenant_id);

-- Index for finding valid sessions
CREATE INDEX IF NOT EXISTS idx_ucm_sessions_valid ON ucm_sessions(tenant_id, is_valid, updated_at DESC);

-- Comment on table
COMMENT ON TABLE ucm_sessions IS 'Stores Playwright browser sessions for UCM login to bypass reCAPTCHA';

-- Comment on columns
COMMENT ON COLUMN ucm_sessions.tenant_id IS 'Reference to tenant (matches cdr_records.tenant_id)';
COMMENT ON COLUMN ucm_sessions.ucm_url IS 'UCM web interface URL (e.g., https://071ffb.c.myucm.cloud:8443)';
COMMENT ON COLUMN ucm_sessions.session_data IS 'Playwright storageState JSON (cookies, localStorage, sessionStorage)';
COMMENT ON COLUMN ucm_sessions.is_valid IS 'Whether session is still valid (set to false when login required)';
COMMENT ON COLUMN ucm_sessions.updated_at IS 'Last time session was refreshed (used for expiry checks)';
