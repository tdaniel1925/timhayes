/**
 * Dashboard Call Detail API Route
 * GET /api/dashboard/calls/[id] - Get call detail with analysis
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getCallDetail } from '@/lib/db/queries/analytics';
import { AppError, DB_ERRORS } from '@/lib/errors';

/**
 * GET /api/dashboard/calls/[id]
 * Get call detail with analysis (client_admin only, filtered by tenant)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get call detail
    const callDetail = await getCallDetail(id, tenantId);

    if (!callDetail) {
      throw new AppError('Call not found', DB_ERRORS.RECORD_NOT_FOUND.code, 404);
    }

    return successResponse(callDetail);
  } catch (error) {
    return handleApiError(error);
  }
}
