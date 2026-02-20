-- AudiaPro Row Level Security (RLS) Policies
-- Enforces tenant isolation and role-based access control

-- ===== ENABLE RLS ON ALL TABLES =====

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pbx_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- ===== HELPER FUNCTIONS =====

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user can access a specific tenant
CREATE OR REPLACE FUNCTION public.can_access_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin() OR public.user_tenant_id() = tenant_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== RLS POLICIES: TENANTS =====

-- Super admins can do everything
CREATE POLICY "Super admins have full access to tenants"
  ON tenants FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = public.user_tenant_id());

-- ===== RLS POLICIES: USERS =====

-- Super admins can manage all users
CREATE POLICY "Super admins have full access to users"
  ON users FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view their own record
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Tenant admins can view users in their tenant
CREATE POLICY "Tenant admins can view their tenant users"
  ON users FOR SELECT
  USING (
    public.user_role() IN ('tenant_admin', 'manager') AND
    tenant_id = public.user_tenant_id()
  );

-- ===== RLS POLICIES: PBX_CONNECTIONS =====

-- Super admins can manage all connections
CREATE POLICY "Super admins have full access to pbx_connections"
  ON pbx_connections FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view connections for their tenant
CREATE POLICY "Users can view their tenant's pbx_connections"
  ON pbx_connections FOR SELECT
  USING (tenant_id = public.user_tenant_id());

-- Tenant admins can manage their tenant's connections
CREATE POLICY "Tenant admins can manage their tenant's pbx_connections"
  ON pbx_connections FOR ALL
  USING (
    public.user_role() = 'tenant_admin' AND
    tenant_id = public.user_tenant_id()
  )
  WITH CHECK (
    public.user_role() = 'tenant_admin' AND
    tenant_id = public.user_tenant_id()
  );

-- ===== RLS POLICIES: CDR_RECORDS =====

-- Super admins can access all CDR records
CREATE POLICY "Super admins have full access to cdr_records"
  ON cdr_records FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view records for their tenant
CREATE POLICY "Users can view their tenant's cdr_records"
  ON cdr_records FOR SELECT
  USING (tenant_id = public.user_tenant_id());

-- Note: Service role (worker) bypasses RLS automatically

-- ===== RLS POLICIES: CALL_ANALYSES =====

-- Super admins can access all call analyses
CREATE POLICY "Super admins have full access to call_analyses"
  ON call_analyses FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view analyses for their tenant
CREATE POLICY "Users can view their tenant's call_analyses"
  ON call_analyses FOR SELECT
  USING (tenant_id = public.user_tenant_id());

-- ===== RLS POLICIES: JOB_QUEUE =====

-- Super admins can view all jobs
CREATE POLICY "Super admins have full access to job_queue"
  ON job_queue FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can view jobs for their tenant
CREATE POLICY "Users can view their tenant's jobs"
  ON job_queue FOR SELECT
  USING (tenant_id = public.user_tenant_id());

-- ===== GRANT PERMISSIONS =====

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
