/**
 * Finalize Step: Update billing counters and mark job complete
 */

import { supabase } from '../lib/supabase.js';

interface FinalizeStepInput {
  cdrRecordId: string;
  tenantId: string;
  wordCount: number;
  duration: number;
  recordingSizeBytes: number;
}

interface FinalizeStepResult {
  success: boolean;
}

/**
 * Finalize processing: update billing counters and mark complete
 */
export async function finalizeStep(
  input: FinalizeStepInput
): Promise<FinalizeStepResult> {
  const { cdrRecordId, tenantId, wordCount, duration, recordingSizeBytes } = input;

  console.log(`[Finalize] Starting finalization for CDR ${cdrRecordId}`);

  // 1. Calculate AI processing cost metrics
  // Deepgram billing is typically per minute of audio
  // Claude billing is per token, roughly ~1.3 tokens per word for analysis
  const audioMinutes = Math.ceil(duration / 60);
  const estimatedTokens = Math.ceil(wordCount * 1.3);

  console.log(`[Finalize] Metrics - Audio: ${audioMinutes}m, Words: ${wordCount}, Tokens: ~${estimatedTokens}`);

  // 2. Update tenant billing counters atomically
  console.log(`[Finalize] Updating tenant billing counters...`);

  const { error: tenantUpdateError } = await supabase.rpc(
    'increment_tenant_usage',
    {
      p_tenant_id: tenantId,
      p_calls_processed: 1,
      p_audio_minutes: audioMinutes,
      p_storage_bytes: recordingSizeBytes,
    }
  );

  if (tenantUpdateError) {
    // Log but don't fail - billing update is important but not critical
    console.error(
      `[Finalize] Failed to update tenant billing: ${tenantUpdateError.message}`
    );
    console.error(
      `[Finalize] Manual billing adjustment needed for tenant ${tenantId}: +1 call, +${audioMinutes}m audio, +${recordingSizeBytes} bytes`
    );
  } else {
    console.log(`[Finalize] Tenant billing counters updated`);
  }

  // 3. Update CDR record processing status
  console.log(`[Finalize] Marking CDR as fully processed...`);

  const { error: cdrUpdateError } = await supabase
    .from('cdr_records')
    .update({
      processing_status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', cdrRecordId);

  if (cdrUpdateError) {
    console.error(
      `[Finalize] Failed to update CDR status: ${cdrUpdateError.message}`
    );
    // Don't throw - processing is complete even if status update fails
  } else {
    console.log(`[Finalize] CDR marked as completed`);
  }

  // 4. Log completion summary
  console.log(
    `[Finalize] Processing complete for CDR ${cdrRecordId} - ${audioMinutes}m audio, ${wordCount} words processed`
  );

  return {
    success: true,
  };
}
