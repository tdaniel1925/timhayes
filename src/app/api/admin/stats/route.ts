/**
 * Admin Statistics API Route
 * GET /api/admin/stats - Get system-wide statistics for admin dashboard
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getTenantCountByStatus } from '@/lib/db/queries/tenants';
import { getConnectionCountByStatus } from '@/lib/db/queries/connections';
import { db } from '@/lib/db';
import { cdrRecords, jobQueue } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * GET /api/admin/stats
 * Get system statistics (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    // Get tenant counts
    const tenantCounts = await getTenantCountByStatus();

    // Get connection counts
    const connectionCounts = await getConnectionCountByStatus();

    // Get calls today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const callsToday = await db
      .select()
      .from(cdrRecords)
      .where(gte(cdrRecords.createdAt, today));

    // Get failed jobs count
    const failedJobs = await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.status, 'failed'));

    // Get pending jobs count
    const pendingJobs = await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.status, 'pending'));

    // Get processing jobs count
    const processingJobs = await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.status, 'processing'));

    const stats = {
      tenants: {
        total: tenantCounts.total,
        active: tenantCounts.active,
        suspended: tenantCounts.suspended,
        cancelled: tenantCounts.cancelled,
      },
      connections: {
        total: connectionCounts.total,
        connected: connectionCounts.connected,
        disconnected: connectionCounts.disconnected,
        error: connectionCounts.error,
      },
      calls: {
        today: callsToday.length,
      },
      jobs: {
        failed: failedJobs.length,
        pending: pendingJobs.length,
        processing: processingJobs.length,
      },
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
