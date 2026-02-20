import { NextRequest, NextResponse } from 'next/server';
import { retryJob } from '@/lib/db/queries/jobs';
import { verifyAuth } from '@/lib/api-utils';
import { createError, ErrorCode } from '@/lib/errors';

/**
 * POST /api/jobs/[id]/retry
 *
 * Retry a failed or retry-status job
 * Super Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyAuth(request, ['super_admin']);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const jobId = params.id;

    // Retry the job
    const job = await retryJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.GENERAL_NOT_FOUND,
            'Job not found or cannot be retried (must be in failed or retry status)'
          ),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: job,
      message: 'Job queued for retry',
    });
  } catch (error) {
    console.error('Retry job error:', error);

    return NextResponse.json(
      {
        error: createError(
          ErrorCode.GENERAL_INTERNAL_ERROR,
          'Failed to retry job',
          error instanceof Error ? { message: error.message } : undefined
        ),
      },
      { status: 500 }
    );
  }
}
