/**
 * Dashboard Statistics API Route
 * GET /api/dashboard/stats - Get dashboard statistics for current tenant
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getTenantDashboardStats, getCallVolumeTrend } from '@/lib/db/queries/analytics';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (client_admin only, filtered by tenant)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify client admin role
    const authResult = await verifyAuth(request, ['client_admin']);

    if (!authResult.authorized || !authResult.user) {
      return new Response(JSON.stringify(authResult.error), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tenantId = authResult.user.tenant_id;
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: { code: 'CB-AUTH-006', message: 'User has no tenant' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters for date range
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    // Get dashboard stats
    const stats = await getTenantDashboardStats(tenantId, dateFrom, dateTo);

    // Get call volume trend (last 30 days)
    const trend = await getCallVolumeTrend(tenantId, 30);

    return successResponse({
      ...stats,
      trend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
