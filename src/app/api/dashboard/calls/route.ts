/**
 * Dashboard Calls API Route
 * GET /api/dashboard/calls - Get calls for current tenant
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getTenantCalls } from '@/lib/db/queries/analytics';

/**
 * GET /api/dashboard/calls
 * Get calls for current tenant with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify client admin role
    const { user } = await verifyAuth(request, ['client_admin']);

    const tenantId = user.tenant_id;
    if (!tenantId) {
      throw new AppError('User has no tenant', 'CB-AUTH-006', 400);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const disposition = searchParams.get('disposition') || undefined;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    // Get calls
    const result = await getTenantCalls(tenantId, {
      page,
      pageSize,
      disposition,
      dateFrom,
      dateTo,
    });

    return successResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
