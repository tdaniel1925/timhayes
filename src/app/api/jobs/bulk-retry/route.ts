import { NextRequest, NextResponse } from 'next/server';
import { retryAllFailedJobs } from '@/lib/db/queries/jobs';
import { verifyAuth } from '@/lib/api-utils';
import { createError, ErrorCode } from '@/lib/errors';

/**
 * POST /api/jobs/bulk-retry
 *
 * Retry all failed/retry-status jobs
 * Super Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyAuth(request, ['super_admin']);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Retry all failed jobs
    const jobs = await retryAllFailedJobs();

    return NextResponse.json({
      data: {
        count: jobs.length,
        jobs,
      },
      message: `${jobs.length} job(s) queued for retry`,
    });
  } catch (error) {
    console.error('Bulk retry jobs error:', error);

    return NextResponse.json(
      {
        error: createError(
          ErrorCode.GENERAL_INTERNAL_ERROR,
          'Failed to retry jobs',
          error instanceof Error ? { message: error.message } : undefined
        ),
      },
      { status: 500 }
    );
  }
}
