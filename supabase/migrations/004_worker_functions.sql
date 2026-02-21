-- AudiaPro Worker Functions
-- Functions needed by the background worker for job processing

-- ===== CLAIM NEXT JOB FUNCTION =====
-- Atomically claims the next pending job from the queue
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions
-- Orders by priority (desc) then created_at (asc)

DROP FUNCTION IF EXISTS claim_next_job();

CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  cdr_record_id uuid,
  job_type text,
  status text,
  priority integer,
  attempts integer,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  UPDATE job_queue
  SET
    status = 'processing',
    started_at = NOW(),
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE job_queue.id = (
    SELECT job_queue.id
    FROM job_queue
    WHERE job_queue.status = 'pending'
      AND (job_queue.scheduled_for IS NULL OR job_queue.scheduled_for <= NOW())
    ORDER BY job_queue.priority DESC, job_queue.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    job_queue.id,
    job_queue.tenant_id,
    job_queue.cdr_record_id,
    job_queue.job_type,
    job_queue.status,
    job_queue.priority,
    job_queue.attempts,
    job_queue.metadata,
    job_queue.created_at,
    job_queue.updated_at;
END;
$$ LANGUAGE plpgsql;

-- ===== INCREMENT TENANT USAGE FUNCTION =====
-- Updates billing_events for call processing
-- Creates new billing record if first call of the month

DROP FUNCTION IF EXISTS increment_tenant_usage(uuid, integer, integer, bigint);

CREATE OR REPLACE FUNCTION increment_tenant_usage(
  p_tenant_id uuid,
  p_calls_processed integer DEFAULT 1,
  p_audio_minutes integer DEFAULT 0,
  p_storage_bytes bigint DEFAULT 0
) RETURNS void AS $$
DECLARE
  v_billing_month date;
BEGIN
  -- Get first day of current month
  v_billing_month := DATE_TRUNC('month', NOW())::date;

  -- Insert or update billing_events
  INSERT INTO billing_events (
    tenant_id,
    billing_month,
    call_count,
    audio_minutes,
    storage_bytes,
    created_at,
    updated_at
  )
  VALUES (
    p_tenant_id,
    v_billing_month,
    p_calls_processed,
    p_audio_minutes,
    p_storage_bytes,
    NOW(),
    NOW()
  )
  ON CONFLICT (tenant_id, billing_month)
  DO UPDATE SET
    call_count = billing_events.call_count + p_calls_processed,
    audio_minutes = billing_events.audio_minutes + p_audio_minutes,
    storage_bytes = billing_events.storage_bytes + p_storage_bytes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ===== GRANT PERMISSIONS =====
-- Allow authenticated users to call these functions

GRANT EXECUTE ON FUNCTION claim_next_job() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_tenant_usage(uuid, integer, integer, bigint) TO authenticated, service_role;
