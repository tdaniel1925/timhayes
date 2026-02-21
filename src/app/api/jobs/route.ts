import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getJobStats } from '@/lib/db/queries/jobs';
import { verifyAuth } from '@/lib/api-utils';
import { createError, ErrorCode } from '@/lib/errors';

/**
 * GET /api/jobs
 *
 * Get all jobs with optional filtering
 * Super Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and authorization
    await verifyAuth(request, ['super_admin']);

    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
      | 'retry'
      | null;
    const tenantId = searchParams.get('tenant_id');
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 100;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0;

    // Get jobs
    const jobs = await getJobs({
      status: status ?? undefined,
      tenantId: tenantId ?? undefined,
      limit,
      offset,
    });

    // Get stats for all job statuses
    const stats = await getJobStats();

    return NextResponse.json({
      data: jobs,
      meta: {
        limit,
        offset,
        total: jobs.length,
        stats,
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);

    return NextResponse.json(
      {
        error: createError(
          ErrorCode.GENERAL_INTERNAL_ERROR,
          'Failed to retrieve jobs',
          error instanceof Error ? { message: error.message } : undefined
        ),
      },
      { status: 500 }
    );
  }
}
