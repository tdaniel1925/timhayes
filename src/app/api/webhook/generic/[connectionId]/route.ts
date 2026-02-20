import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  genericWebhookSchema,
  mapGenericStatus,
} from '@/lib/validations/webhook';
import { createCDR } from '@/lib/db/queries/cdr';
import { createJob } from '@/lib/db/queries/jobs';
import { db } from '@/lib/db';
import { pbxConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createError, ErrorCode } from '@/lib/errors';

/**
 * POST /api/webhook/generic/[connectionId]
 *
 * Receives generic webhooks from any PBX system that supports
 * the AudiaPro standard webhook format.
 *
 * Auth: Validates webhook_secret from query param or X-Webhook-Secret header
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const connectionId = params.connectionId;

    // 1. Get webhook secret from query param or header
    const webhookSecret =
      request.nextUrl.searchParams.get('webhook_secret') ||
      request.headers.get('X-Webhook-Secret');

    if (!webhookSecret) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_INVALID_WEBHOOK_SECRET,
            'Missing webhook_secret parameter or X-Webhook-Secret header'
          ),
        },
        { status: 401 }
      );
    }

    // 2. Look up PBX connection and verify secret
    const connection = await db.query.pbxConnections.findFirst({
      where: eq(pbxConnections.id, connectionId),
      with: {
        tenant: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_CONNECTION_NOT_FOUND,
            'PBX connection not found'
          ),
        },
        { status: 404 }
      );
    }

    // Validate webhook secret
    if (connection.webhookSecret !== webhookSecret) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_INVALID_WEBHOOK_SECRET,
            'Invalid webhook secret'
          ),
        },
        { status: 401 }
      );
    }

    // 3. Verify connection and tenant are active
    if (!connection.isActive) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_CONNECTION_NOT_FOUND,
            'PBX connection is disabled'
          ),
        },
        { status: 403 }
      );
    }

    const tenant = connection.tenant;
    if (!tenant) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_CONNECTION_NOT_FOUND,
            'Tenant not found for this connection'
          ),
        },
        { status: 404 }
      );
    }

    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_TENANT_SUSPENDED,
            `Tenant account is ${tenant.status}`
          ),
        },
        { status: 403 }
      );
    }

    // 4. Parse and validate webhook payload
    const rawBody = await request.json();

    let payload;
    try {
      payload = genericWebhookSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: createError(
              ErrorCode.API_PAYLOAD_VALIDATION_FAILED,
              'Invalid webhook payload format',
              { validationErrors: error.errors }
            ),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 5. Map generic status to our disposition enum
    const disposition = mapGenericStatus(payload.status);

    // 6. Parse timestamps
    const startTime = new Date(payload.start_time);
    const endTime = payload.end_time ? new Date(payload.end_time) : undefined;

    // Calculate duration if not provided
    let durationSeconds = payload.duration;
    if (!durationSeconds && endTime) {
      durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }

    // Determine if this call should be processed
    const isAnswered = disposition === 'answered';
    const hasRecording = !!(payload.recording_url || payload.recording_filename);
    const shouldProcess = isAnswered && hasRecording;

    // 7. Insert CDR record
    const cdr = await createCDR({
      tenantId: tenant.id,
      pbxConnectionId: connection.id,
      sessionId: payload.call_id,
      callDirection: payload.direction,
      src: payload.from,
      dst: payload.to,
      callerName: payload.caller_name,
      clid: `"${payload.caller_name}" <${payload.from}>`,
      startTime,
      answerTime: isAnswered ? startTime : undefined, // Use start time as answer time for answered calls
      endTime,
      durationSeconds,
      billsecSeconds: payload.billsec ?? durationSeconds,
      disposition,
      recordingFilename: payload.recording_filename,
      transcriptStatus: shouldProcess ? 'pending' : 'skipped',
      analysisStatus: shouldProcess ? 'pending' : 'skipped',
      rawWebhookPayload: rawBody,
    });

    // 8. Create job queue entry if call should be processed
    if (shouldProcess) {
      await createJob({
        tenantId: tenant.id,
        cdrRecordId: cdr.id,
        jobType: 'full_pipeline',
        priority: 0,
      });
    }

    // 9. Return 200 OK
    return NextResponse.json(
      {
        data: {
          cdrRecordId: cdr.id,
          queued: shouldProcess,
          message: shouldProcess
            ? 'CDR received and queued for processing'
            : 'CDR received (not queued - no recording or not answered)',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Generic webhook error:', error);

    return NextResponse.json(
      {
        error: createError(
          ErrorCode.GENERAL_INTERNAL_ERROR,
          'Internal server error processing webhook',
          error instanceof Error ? { message: error.message } : undefined
        ),
      },
      { status: 500 }
    );
  }
}
