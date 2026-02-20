import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  grandstreamWebhookSchema,
  determineCallDirection,
  mapGrandstreamDisposition,
  parseGrandstreamTimestamp,
} from '@/lib/validations/webhook';
import { createCDR } from '@/lib/db/queries/cdr';
import { createJob } from '@/lib/db/queries/jobs';
import { db } from '@/lib/db';
import { pbxConnections, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createError, ErrorCode } from '@/lib/errors';

/**
 * POST /api/webhook/grandstream/[connectionId]
 *
 * Receives CDR Real-Time Output webhooks from Grandstream UCM systems.
 *
 * Auth: Validates webhook_secret from query param or X-Webhook-Secret header
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const { connectionId } = await params;

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
      payload = grandstreamWebhookSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: createError(
              ErrorCode.API_PAYLOAD_VALIDATION_FAILED,
              'Invalid webhook payload format',
              { validationErrors: error.issues }
            ),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 5. Determine call direction
    const callDirection = determineCallDirection(
      payload.dcontext,
      payload.src_trunk_name,
      payload.dst_trunk_name
    );

    // 6. Parse timestamps
    const startTime = parseGrandstreamTimestamp(payload.start);
    const answerTime = parseGrandstreamTimestamp(payload.answer);
    const endTime = parseGrandstreamTimestamp(payload.end);

    if (!startTime) {
      return NextResponse.json(
        {
          error: createError(
            ErrorCode.API_PAYLOAD_VALIDATION_FAILED,
            'Invalid or missing start time'
          ),
        },
        { status: 400 }
      );
    }

    // 7. Map disposition
    const disposition = mapGrandstreamDisposition(payload.disposition);

    // Determine if this call should be processed
    const isAnswered = disposition === 'answered';
    const hasRecording = payload.recordfiles && payload.recordfiles.trim() !== '';
    const shouldProcess = isAnswered && hasRecording;

    // 8. Insert CDR record
    const cdr = await createCDR({
      tenantId: tenant.id,
      pbxConnectionId: connection.id,
      sessionId: payload.session,
      callDirection,
      src: payload.src,
      dst: payload.dst,
      callerName: payload.caller_name,
      clid: payload.clid,
      startTime: new Date(startTime),
      answerTime: answerTime ? new Date(answerTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      durationSeconds: payload.duration,
      billsecSeconds: payload.billsec,
      disposition,
      actionType: payload.action_type,
      actionOwner: payload.action_owner,
      srcTrunkName: payload.src_trunk_name,
      dstTrunkName: payload.dst_trunk_name,
      recordingFilename: payload.recordfiles,
      transcriptStatus: shouldProcess ? 'pending' : 'skipped',
      analysisStatus: shouldProcess ? 'pending' : 'skipped',
      rawWebhookPayload: rawBody,
    });

    // 9. Create job queue entry if call should be processed
    if (shouldProcess) {
      await createJob({
        tenantId: tenant.id,
        cdrRecordId: cdr.id,
        jobType: 'full_pipeline',
        priority: 0,
      });
    }

    // 10. Return 200 OK
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
    console.error('Grandstream webhook error:', error);

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
