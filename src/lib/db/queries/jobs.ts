import { db } from '../index';
import { jobQueue, cdrRecords } from '../schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

/**
 * Job Queue Operations
 *
 * These functions manage the background job queue for processing call recordings.
 */

export interface CreateJobParams {
  tenantId: string;
  cdrRecordId: string;
  jobType: 'download_recording' | 'transcribe' | 'analyze' | 'full_pipeline';
  priority?: number;
}

/**
 * Creates a new job in the queue
 */
export async function createJob(params: CreateJobParams) {
  const [job] = await db
    .insert(jobQueue)
    .values({
      tenantId: params.tenantId,
      cdrRecordId: params.cdrRecordId,
      jobType: params.jobType,
      priority: params.priority ?? 0,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    })
    .returning();

  return job;
}

/**
 * Claims the next pending job (atomic operation)
 *
 * This uses an atomic UPDATE...RETURNING to ensure only one worker
 * can claim a given job. Jobs are selected by priority (DESC) then
 * created_at (ASC).
 */
export async function claimNextJob() {
  const [job] = await db
    .update(jobQueue)
    .set({
      status: 'processing',
      startedAt: new Date(),
      attempts: sql`${jobQueue.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(jobQueue.status, 'pending'),
        sql`${jobQueue.id} = (
          SELECT id FROM ${jobQueue}
          WHERE status = 'pending'
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )`
      )
    )
    .returning();

  return job ?? null;
}

/**
 * Marks a job as completed
 */
export async function completeJob(jobId: string) {
  const [job] = await db
    .update(jobQueue)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobQueue.id, jobId))
    .returning();

  return job;
}

/**
 * Marks a job as failed with an error message
 */
export async function failJob(jobId: string, errorMessage: string) {
  const job = await Promise.race([
    db.query.jobQueue.findFirst({
      where: eq(jobQueue.id, jobId),
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
    )
  ]) as any;

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // If we haven't exceeded max attempts, mark for retry
  const shouldRetry = job.attempts < job.maxAttempts;

  const [updatedJob] = await db
    .update(jobQueue)
    .set({
      status: shouldRetry ? 'retry' : 'failed',
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(jobQueue.id, jobId))
    .returning();

  return updatedJob;
}

/**
 * Retries a failed or retry-status job by resetting it to pending
 */
export async function retryJob(jobId: string) {
  const [job] = await db
    .update(jobQueue)
    .set({
      status: 'pending',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(jobQueue.id, jobId),
        inArray(jobQueue.status, ['failed', 'retry'])
      )
    )
    .returning();

  return job;
}

/**
 * Bulk retry all failed jobs
 */
export async function retryAllFailedJobs() {
  const jobs = await db
    .update(jobQueue)
    .set({
      status: 'pending',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(inArray(jobQueue.status, ['failed', 'retry']))
    .returning();

  return jobs;
}

/**
 * Get all jobs with optional filtering
 */
export interface GetJobsParams {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  tenantId?: string;
  limit?: number;
  offset?: number;
}

export async function getJobs(params: GetJobsParams = {}) {
  try {
    const conditions = [];

    if (params.status) {
      conditions.push(eq(jobQueue.status, params.status));
    }

    if (params.tenantId) {
      conditions.push(eq(jobQueue.tenantId, params.tenantId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const jobs = await Promise.race([
      db.query.jobQueue.findMany({
        where: whereClause,
        with: {
          cdrRecord: true,
        },
        orderBy: (jobQueue, { desc }) => [desc(jobQueue.createdAt)],
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any;

    return jobs;
  } catch (error) {
    console.error('[getJobs] Error:', error);
    throw error;
  }
}

/**
 * Get job by ID with CDR record details
 */
export async function getJobById(jobId: string) {
  try {
    const job = await Promise.race([
      db.query.jobQueue.findFirst({
        where: eq(jobQueue.id, jobId),
        with: {
          cdrRecord: true,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any;

    return job ?? null;
  } catch (error) {
    console.error('[getJobById] Error:', error);
    throw error;
  }
}

/**
 * Get job queue statistics
 */
export async function getJobStats() {
  try {
    const stats = await Promise.race([
      db
        .select({
          status: jobQueue.status,
          count: sql<number>`count(*)::int`,
        })
        .from(jobQueue)
        .groupBy(jobQueue.status),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any[];

    return stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      },
      {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retry: 0,
      } as Record<string, number>
    );
  } catch (error) {
    console.error('[getJobStats] Error:', error);
    throw error;
  }
}
