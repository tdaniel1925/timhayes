/**
 * Worker Pipeline: Orchestrates all processing steps
 */

import { supabase } from './lib/supabase.js';
import { downloadStep } from './steps/download.js';
import { transcribeStep } from './steps/transcribe.js';
import { analyzeStep } from './steps/analyze.js';
import { finalizeStep } from './steps/finalize.js';

interface Job {
  id: string;
  tenant_id: string;
  cdr_record_id: string;
  job_type: string;
  status: string;
  attempts: number;
  metadata?: Record<string, any>;
}

interface PipelineResult {
  success: boolean;
  jobId: string;
  error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 60s

/**
 * Process a single job through the full pipeline
 */
export async function processPipeline(job: Job): Promise<PipelineResult> {
  const { id: jobId, tenant_id, cdr_record_id, job_type } = job;

  console.log(
    `[Pipeline] Starting job ${jobId} - Type: ${job_type}, CDR: ${cdr_record_id}`
  );

  const pipelineStartTime = Date.now();
  let currentStep = 'download';

  try {
    // Step 1: Download recording from PBX
    currentStep = 'download';
    console.log(`[Pipeline] Step 1/4: Download`);
    await updateJobMetadata(jobId, { currentStep });

    const downloadResult = await downloadStep({
      cdrRecordId: cdr_record_id,
      tenantId: tenant_id,
    });

    console.log(`[Pipeline] Download complete: ${downloadResult.recordingPath}`);

    // Step 2: Transcribe with Deepgram
    currentStep = 'transcribe';
    console.log(`[Pipeline] Step 2/4: Transcribe`);
    await updateJobMetadata(jobId, { currentStep });

    const transcribeResult = await transcribeStep({
      cdrRecordId: cdr_record_id,
      tenantId: tenant_id,
      recordingPath: downloadResult.recordingPath,
    });

    console.log(
      `[Pipeline] Transcription complete: ${transcribeResult.wordCount} words`
    );

    // Step 3: AI Analysis with Claude
    currentStep = 'analyze';
    console.log(`[Pipeline] Step 3/4: AI Analysis`);
    await updateJobMetadata(jobId, { currentStep });

    const analyzeResult = await analyzeStep({
      cdrRecordId: cdr_record_id,
      tenantId: tenant_id,
      transcriptPath: transcribeResult.transcriptPath,
    });

    console.log(
      `[Pipeline] Analysis complete: ${analyzeResult.sentimentOverall} sentiment`
    );

    // Step 4: Finalize and update billing
    currentStep = 'finalize';
    console.log(`[Pipeline] Step 4/4: Finalize`);
    await updateJobMetadata(jobId, { currentStep });

    await finalizeStep({
      cdrRecordId: cdr_record_id,
      tenantId: tenant_id,
      wordCount: transcribeResult.wordCount,
      duration: transcribeResult.duration,
      recordingSizeBytes: downloadResult.recordingSizeBytes,
    });

    // Mark job as completed
    const processingTime = Date.now() - pipelineStartTime;
    console.log(`[Pipeline] Job ${jobId} completed in ${processingTime}ms`);

    await completeJob(jobId, {
      completedAt: new Date().toISOString(),
      processingTimeMs: processingTime,
      downloadPath: downloadResult.recordingPath,
      transcriptPath: transcribeResult.transcriptPath,
      analysisPath: analyzeResult.analysisPath,
      analysisId: analyzeResult.callAnalysisId,
    });

    return {
      success: true,
      jobId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingTime = Date.now() - pipelineStartTime;

    console.error(
      `[Pipeline] Job ${jobId} failed at step '${currentStep}': ${errorMessage}`
    );

    // Determine if we should retry
    const shouldRetry = job.attempts < MAX_RETRIES;

    if (shouldRetry) {
      const retryDelay = RETRY_DELAYS[job.attempts] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      console.log(
        `[Pipeline] Job ${jobId} will retry (attempt ${job.attempts + 1}/${MAX_RETRIES}) in ${retryDelay}ms`
      );

      await failJobWithRetry(jobId, errorMessage, currentStep, retryDelay);
    } else {
      console.error(
        `[Pipeline] Job ${jobId} exhausted all retries (${MAX_RETRIES}), marking as failed`
      );

      await failJobPermanently(jobId, errorMessage, currentStep, processingTime);
    }

    return {
      success: false,
      jobId,
      error: errorMessage,
    };
  }
}

/**
 * Update job metadata (non-blocking)
 */
async function updateJobMetadata(
  jobId: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('job_queue')
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (error) {
    // Log but don't throw - metadata updates are non-critical
    console.warn(
      `[Pipeline] Failed to update job metadata: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

/**
 * Mark job as completed
 */
async function completeJob(
  jobId: string,
  result: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[Pipeline] Failed to mark job as completed: ${error.message}`);
  }
}

/**
 * Mark job as failed but schedule retry
 */
async function failJobWithRetry(
  jobId: string,
  errorMessage: string,
  failedStep: string,
  retryDelayMs: number
): Promise<void> {
  const scheduledFor = new Date(Date.now() + retryDelayMs);

  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'pending', // Back to pending for retry
      error: errorMessage,
      metadata: { failedStep, lastError: errorMessage },
      scheduled_for: scheduledFor.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[Pipeline] Failed to schedule retry: ${error.message}`);
  }
}

/**
 * Mark job as permanently failed
 */
async function failJobPermanently(
  jobId: string,
  errorMessage: string,
  failedStep: string,
  processingTimeMs: number
): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'failed',
      error: errorMessage,
      completed_at: new Date().toISOString(),
      result: {
        failedStep,
        errorMessage,
        processingTimeMs,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[Pipeline] Failed to mark job as failed: ${error.message}`);
  }
}
