/**
 * Utility functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AppError, AUTH_ERRORS, createError, formatErrorResponse } from './errors';

/**
 * Verify that the user is authenticated and has the required role
 */
export async function verifyAuth(request: NextRequest, allowedRoles: ('super_admin' | 'client_admin')[]) {
  const supabase = await createServerClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw createError(AUTH_ERRORS.SESSION_EXPIRED);
  }

  // Get user details from database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, role, tenant_id, is_active, email, full_name')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData) {
    throw createError(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  if (!userData.is_active) {
    throw new AppError('Account is inactive', AUTH_ERRORS.ACCOUNT_SUSPENDED.code, 403);
  }

  if (!allowedRoles.includes(userData.role as any)) {
    throw createError(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS);
  }

  // Check if tenant is active (for client_admin users)
  if (userData.role === 'client_admin' && userData.tenant_id) {
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', userData.tenant_id)
      .single();

    if (tenantError || !tenantData) {
      throw new AppError('Tenant not found', 'CB-AUTH-005', 404);
    }

    if (tenantData.status === 'suspended') {
      throw createError(AUTH_ERRORS.ACCOUNT_SUSPENDED);
    }
  }

  return {
    user: userData,
    session,
  };
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(formatErrorResponse(error), { status: error.statusCode });
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: 'CB-UNKNOWN-ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'CB-UNKNOWN-ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

/**
 * Create a success response with data
 */
export function successResponse<T>(data: T, meta?: Record<string, any>) {
  return NextResponse.json({
    data,
    error: null,
    ...(meta && { meta }),
  });
}
