/**
 * Dashboard Call Detail API Route
 * GET /api/dashboard/calls/[id] - Get call detail with analysis
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getCallDetail } from '@/lib/db/queries/analytics';
import { AppError } from '@/lib/errors';

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
    const { user } = await verifyAuth(request, ['client_admin']);

    const tenantId = user.tenant_id;
    if (!tenantId) {
      throw new AppError('User has no tenant', 'CB-AUTH-006', 400);
    }

    const { id } = await params;

    // Get call detail
    const callDetail = await getCallDetail(id, tenantId);

    if (!callDetail) {
      throw new AppError('Call not found', 'CB-API-006', 404);
    }

    return successResponse(callDetail);
  } catch (error) {
    return handleApiError(error);
  }
}
