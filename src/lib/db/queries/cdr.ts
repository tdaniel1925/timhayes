import { db } from '../index';
import { cdrRecords } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * CDR (Call Detail Record) Operations
 */

export interface CreateCDRParams {
  tenantId: string;
  pbxConnectionId: string;
  sessionId?: string;
  callDirection?: 'inbound' | 'outbound' | 'internal';
  src?: string;
  dst?: string;
  callerName?: string;
  clid?: string;
  startTime: Date;
  answerTime?: Date;
  endTime?: Date;
  durationSeconds?: number;
  billsecSeconds?: number;
  disposition?: 'answered' | 'no_answer' | 'busy' | 'failed' | 'congestion';
  actionType?: string;
  actionOwner?: string;
  srcTrunkName?: string;
  dstTrunkName?: string;
  recordingFilename?: string;
  transcriptStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  rawWebhookPayload?: Record<string, unknown>;
}

/**
 * Creates a new CDR record
 */
export async function createCDR(params: CreateCDRParams) {
  const [cdr] = await db
    .insert(cdrRecords)
    .values({
      tenantId: params.tenantId,
      pbxConnectionId: params.pbxConnectionId,
      sessionId: params.sessionId,
      callDirection: params.callDirection,
      src: params.src,
      dst: params.dst,
      callerName: params.callerName,
      clid: params.clid,
      startTime: params.startTime,
      answerTime: params.answerTime,
      endTime: params.endTime,
      durationSeconds: params.durationSeconds,
      billsecSeconds: params.billsecSeconds,
      disposition: params.disposition,
      actionType: params.actionType,
      actionOwner: params.actionOwner,
      srcTrunkName: params.srcTrunkName,
      dstTrunkName: params.dstTrunkName,
      recordingFilename: params.recordingFilename,
      transcriptStatus: params.transcriptStatus ?? 'pending',
      analysisStatus: params.analysisStatus ?? 'pending',
      rawWebhookPayload: params.rawWebhookPayload,
    })
    .returning();

  return cdr;
}

/**
 * Get CDR by ID
 */
export async function getCDRById(id: string) {
  try {
    const cdr = await Promise.race([
      db.query.cdrRecords.findFirst({
        where: eq(cdrRecords.id, id),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any;

    return cdr ?? null;
  } catch (error) {
    console.error('[getCDRById] Error:', error);
    throw error;
  }
}

/**
 * Update CDR recording information
 */
export async function updateCDRRecording(
  id: string,
  data: {
    recordingStoragePath?: string;
    recordingDownloaded?: boolean;
    recordingDownloadedAt?: Date;
    recordingSizeBytes?: number;
    recordingDurationMs?: number;
  }
) {
  const [cdr] = await db
    .update(cdrRecords)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(cdrRecords.id, id))
    .returning();

  return cdr;
}

/**
 * Update CDR transcript information
 */
export async function updateCDRTranscript(
  id: string,
  data: {
    transcriptStoragePath?: string;
    transcriptStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  }
) {
  const [cdr] = await db
    .update(cdrRecords)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(cdrRecords.id, id))
    .returning();

  return cdr;
}

/**
 * Update CDR analysis status
 */
export async function updateCDRAnalysis(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
) {
  const [cdr] = await db
    .update(cdrRecords)
    .set({
      analysisStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(cdrRecords.id, id))
    .returning();

  return cdr;
}
