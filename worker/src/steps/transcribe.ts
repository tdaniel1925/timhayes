/**
 * Transcription Step: Transcribe recording with Deepgram
 */

import { transcribeAudio, formatTranscriptForDisplay } from '../lib/deepgram.js';
import { supabase, downloadFromStorage, uploadToStorage } from '../lib/supabase.js';
import type { TranscriptResult } from '../lib/deepgram.js';

interface TranscribeStepInput {
  cdrRecordId: string;
  tenantId: string;
  recordingPath: string;
}

interface TranscribeStepResult {
  transcriptPath: string;
  transcriptTextPath: string;
  wordCount: number;
  duration: number;
  speakers: number;
}

/**
 * Transcribe recording and save results to storage
 */
export async function transcribeStep(
  input: TranscribeStepInput
): Promise<TranscribeStepResult> {
  const { cdrRecordId, tenantId, recordingPath } = input;

  console.log(`[Transcribe] Starting for CDR ${cdrRecordId}`);

  // 1. Download recording from storage
  console.log(`[Transcribe] Downloading recording from storage: ${recordingPath}`);

  let recordingBuffer: Buffer;
  try {
    recordingBuffer = await downloadFromStorage('call-recordings', recordingPath);
  } catch (error) {
    throw new Error(
      `Failed to download recording from storage: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  console.log(
    `[Transcribe] Recording downloaded: ${(recordingBuffer.length / 1024).toFixed(2)} KB`
  );

  // 2. Transcribe with Deepgram
  console.log(`[Transcribe] Sending to Deepgram API...`);

  let transcript: TranscriptResult;
  const transcribeStartTime = Date.now();
  try {
    transcript = await transcribeAudio(recordingBuffer);
  } catch (error) {
    throw new Error(
      `Deepgram transcription failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  const transcribeTime = Date.now() - transcribeStartTime;
  console.log(
    `[Transcribe] Transcription complete in ${transcribeTime}ms - ${transcript.wordCount} words, ${transcript.speakers} speakers, ${transcript.duration.toFixed(1)}s duration`
  );

  // 3. Upload full transcript JSON to storage
  const storagePathPrefix = `${tenantId}/${cdrRecordId}`;
  const transcriptPath = `${storagePathPrefix}/transcript.json`;

  console.log(`[Transcribe] Uploading transcript JSON to: ${transcriptPath}`);

  try {
    const transcriptJson = JSON.stringify(transcript, null, 2);
    await uploadToStorage(
      'call-transcripts',
      transcriptPath,
      Buffer.from(transcriptJson, 'utf8'),
      'application/json'
    );
  } catch (error) {
    throw new Error(
      `Failed to upload transcript JSON: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  // 4. Upload formatted text transcript for easy viewing
  const transcriptTextPath = `${storagePathPrefix}/transcript.txt`;

  console.log(
    `[Transcribe] Uploading formatted transcript text to: ${transcriptTextPath}`
  );

  try {
    const formattedText = formatTranscriptForDisplay(transcript);
    await uploadToStorage(
      'call-transcripts',
      transcriptTextPath,
      Buffer.from(formattedText, 'utf8'),
      'text/plain'
    );
  } catch (error) {
    // Non-critical - text file is for convenience
    console.warn(
      `[Transcribe] Failed to upload text transcript (non-critical): ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  // 5. Update CDR record with transcript metadata
  const { error: updateError } = await supabase
    .from('cdr_records')
    .update({
      transcript_storage_path: transcriptPath,
      transcript_text_storage_path: transcriptTextPath,
      transcript_word_count: transcript.wordCount,
      transcript_confidence: transcript.confidence,
      speaker_count: transcript.speakers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cdrRecordId);

  if (updateError) {
    console.error(
      `[Transcribe] Failed to update CDR record: ${updateError.message}`
    );
    // Don't throw - transcripts are uploaded, this is just metadata
  }

  return {
    transcriptPath,
    transcriptTextPath,
    wordCount: transcript.wordCount,
    duration: transcript.duration,
    speakers: transcript.speakers,
  };
}
