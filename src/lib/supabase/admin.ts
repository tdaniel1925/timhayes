import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with service role key
 * WARNING: This bypasses RLS. Use only in secure server contexts (API routes, worker)
 *
 * Use cases:
 * - Worker background jobs (downloading, transcribing, analyzing)
 * - Webhook endpoints (creating CDR records from external sources)
 * - Admin operations that need to bypass RLS
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to check if a tenant is active
 */
export async function isTenantActive(tenantId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .single();

  return tenant?.status === 'active';
}

/**
 * Helper to get tenant by ID
 */
export async function getTenant(tenantId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper to get PBX connection by ID
 */
export async function getPbxConnection(connectionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('pbx_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (error) throw error;
  return data;
}
