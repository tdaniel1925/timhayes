import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Creates a Supabase client for use in middleware
 * Handles cookie management for auth sessions
 */
export async function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if needed
  await supabase.auth.getUser();

  return { supabase, response: supabaseResponse };
}

/**
 * Get user session and metadata from middleware
 */
export async function getUserSession(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, userRecord: null, response };
  }

  // Get user record from database with role and tenant info
  const { data: userRecord } = await supabase
    .from('users')
    .select('id, tenant_id, email, full_name, role')
    .eq('id', user.id)
    .single();

  return { user, userRecord, response };
}
