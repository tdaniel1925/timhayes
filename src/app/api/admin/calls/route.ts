/**
 * Admin Calls API Route
 * GET /api/admin/calls - Get all calls across all tenants
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getAllCalls } from '@/lib/db/queries/analytics';

/**
 * GET /api/admin/calls
 * Get all calls with filters (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const tenantId = searchParams.get('tenantId') || undefined;
    const disposition = searchParams.get('disposition') || undefined;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    // Get all calls
    const result = await getAllCalls({
      page,
      pageSize,
      tenantId,
      disposition,
      dateFrom,
      dateTo,
    });

    return successResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
