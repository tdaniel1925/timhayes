-- AudiaPro Storage Buckets Configuration
-- Creates private buckets for recordings, transcripts, and analyses

-- ===== CREATE STORAGE BUCKETS =====

-- Bucket: call-recordings (call recording WAV files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false, -- private, accessed via signed URLs
  104857600, -- 100 MB max file size
  ARRAY['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: call-transcripts (transcript JSON and text files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-transcripts',
  'call-transcripts',
  false, -- private
  10485760, -- 10 MB max file size
  ARRAY['application/json', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: call-analyses (AI analysis JSON files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-analyses',
  'call-analyses',
  false, -- private
  10485760, -- 10 MB max file size
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- ===== STORAGE RLS POLICIES =====

-- Helper function to extract tenant_id from storage path
-- Path format: {tenant_id}/{cdr_id}/{filename}
CREATE OR REPLACE FUNCTION public.extract_tenant_id_from_path(path TEXT)
RETURNS UUID AS $$
  SELECT CASE
    WHEN path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' THEN
      (regexp_match(path, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]::UUID
    ELSE NULL
  END;
$$ LANGUAGE sql IMMUTABLE;

-- ===== CALL-RECORDINGS BUCKET POLICIES =====

-- Super admins can access all recordings
CREATE POLICY "Super admins full access to recordings"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'call-recordings' AND
    public.is_super_admin()
  )
  WITH CHECK (
    bucket_id = 'call-recordings' AND
    public.is_super_admin()
  );

-- Users can download recordings for their tenant
CREATE POLICY "Users can download their tenant's recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings' AND
    public.extract_tenant_id_from_path(name) = public.user_tenant_id()
  );

-- Service role has full access (handled via service_role key)

-- ===== CALL-TRANSCRIPTS BUCKET POLICIES =====

-- Super admins can access all transcripts
CREATE POLICY "Super admins full access to transcripts"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'call-transcripts' AND
    public.is_super_admin()
  )
  WITH CHECK (
    bucket_id = 'call-transcripts' AND
    public.is_super_admin()
  );

-- Users can download transcripts for their tenant
CREATE POLICY "Users can download their tenant's transcripts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-transcripts' AND
    public.extract_tenant_id_from_path(name) = public.user_tenant_id()
  );

-- ===== CALL-ANALYSES BUCKET POLICIES =====

-- Super admins can access all analyses
CREATE POLICY "Super admins full access to analyses"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'call-analyses' AND
    public.is_super_admin()
  )
  WITH CHECK (
    bucket_id = 'call-analyses' AND
    public.is_super_admin()
  );

-- Users can download analyses for their tenant
CREATE POLICY "Users can download their tenant's analyses"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-analyses' AND
    public.extract_tenant_id_from_path(name) = public.user_tenant_id()
  );
