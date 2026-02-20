-- AudiaPro Additional Indexes and Optimizations
-- Performance indexes for common query patterns

-- ===== ADDITIONAL INDEXES =====

-- Index for searching calls by caller name
CREATE INDEX IF NOT EXISTS cdr_records_caller_name_idx
  ON cdr_records USING gin(to_tsvector('english', caller_name))
  WHERE caller_name IS NOT NULL;

-- Index for searching calls by source/destination
CREATE INDEX IF NOT EXISTS cdr_records_src_idx ON cdr_records(src) WHERE src IS NOT NULL;
CREATE INDEX IF NOT EXISTS cdr_records_dst_idx ON cdr_records(dst) WHERE dst IS NOT NULL;

-- Index for filtering by recording availability
CREATE INDEX IF NOT EXISTS cdr_records_recording_downloaded_idx
  ON cdr_records(recording_downloaded, tenant_id);

-- Index for filtering by processing status
CREATE INDEX IF NOT EXISTS cdr_records_transcript_status_idx
  ON cdr_records(transcript_status, tenant_id);

CREATE INDEX IF NOT EXISTS cdr_records_analysis_status_idx
  ON cdr_records(analysis_status, tenant_id);

-- Index for call_analyses sentiment filtering
CREATE INDEX IF NOT EXISTS call_analyses_sentiment_idx
  ON call_analyses(sentiment_overall, tenant_id);

-- Index for call_analyses satisfaction filtering
CREATE INDEX IF NOT EXISTS call_analyses_satisfaction_idx
  ON call_analyses(satisfaction_prediction, tenant_id);

-- Index for finding jobs that need processing
CREATE INDEX IF NOT EXISTS job_queue_pending_idx
  ON job_queue(status, created_at)
  WHERE status IN ('pending', 'retry');

-- Index for billing events by month
CREATE INDEX IF NOT EXISTS billing_events_month_idx
  ON billing_events(billing_month DESC);

-- Index for email reports scheduling
CREATE INDEX IF NOT EXISTS email_reports_next_send_idx
  ON email_reports(next_send_at, is_active)
  WHERE is_active = true AND next_send_at IS NOT NULL;

-- ===== PARTIAL INDEXES FOR COMMON FILTERS =====

-- Answered calls only (most common query)
CREATE INDEX IF NOT EXISTS cdr_records_answered_calls_idx
  ON cdr_records(tenant_id, start_time DESC)
  WHERE disposition = 'answered';

-- Active tenants only
CREATE INDEX IF NOT EXISTS tenants_active_idx
  ON tenants(id, created_at DESC)
  WHERE status = 'active';

-- Active PBX connections
CREATE INDEX IF NOT EXISTS pbx_connections_active_idx
  ON pbx_connections(tenant_id, is_active)
  WHERE is_active = true;

-- ===== GIN INDEXES FOR JSONB COLUMNS =====

-- Index for searching keywords in call_analyses
CREATE INDEX IF NOT EXISTS call_analyses_keywords_gin_idx
  ON call_analyses USING gin(keywords);

-- Index for searching topics
CREATE INDEX IF NOT EXISTS call_analyses_topics_gin_idx
  ON call_analyses USING gin(topics);

-- Index for custom keyword matches
CREATE INDEX IF NOT EXISTS call_analyses_custom_keywords_gin_idx
  ON call_analyses USING gin(custom_keyword_matches);

-- Index for CDR raw payload (for debugging)
CREATE INDEX IF NOT EXISTS cdr_records_raw_payload_gin_idx
  ON cdr_records USING gin(raw_webhook_payload);

-- ===== STATISTICS AND OPTIMIZATIONS =====

-- Update table statistics for query planner
ANALYZE tenants;
ANALYZE users;
ANALYZE pbx_connections;
ANALYZE cdr_records;
ANALYZE call_analyses;
ANALYZE custom_keywords;
ANALYZE job_queue;
ANALYZE email_reports;
ANALYZE billing_events;

-- Set autovacuum settings for high-traffic tables
ALTER TABLE cdr_records SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE job_queue SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE call_analyses SET (autovacuum_vacuum_scale_factor = 0.1);

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Client organizations using AudiaPro';
COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE pbx_connections IS 'PBX system connections for each tenant';
COMMENT ON TABLE cdr_records IS 'Call Detail Records from PBX webhooks';
COMMENT ON TABLE call_analyses IS 'AI analysis results for each call';
COMMENT ON TABLE custom_keywords IS 'Client-defined keywords to track';
COMMENT ON TABLE job_queue IS 'Background job processing queue';
COMMENT ON TABLE email_reports IS 'Scheduled email report preferences';
COMMENT ON TABLE billing_events IS 'Monthly billing tracking per tenant';
