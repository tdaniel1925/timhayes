/**
 * AI Analysis Step: Analyze call with Claude AI
 */

import { analyzeCall } from '../lib/claude.js';
import { supabase, downloadFromStorage, uploadToStorage } from '../lib/supabase.js';
import type { TranscriptResult } from '../lib/deepgram.js';
import type { CallAnalysisResult } from '../lib/claude.js';

interface AnalyzeStepInput {
  cdrRecordId: string;
  tenantId: string;
  transcriptPath: string;
}

interface AnalyzeStepResult {
  analysisPath: string;
  callAnalysisId: string;
  sentimentOverall: string;
  sentimentScore: number;
}

/**
 * Analyze call transcript with Claude AI and save results
 */
export async function analyzeStep(
  input: AnalyzeStepInput
): Promise<AnalyzeStepResult> {
  const { cdrRecordId, tenantId, transcriptPath } = input;

  console.log(`[Analyze] Starting AI analysis for CDR ${cdrRecordId}`);

  // 1. Download transcript from storage
  console.log(`[Analyze] Downloading transcript from: ${transcriptPath}`);

  let transcript: TranscriptResult;
  try {
    const transcriptBuffer = await downloadFromStorage(
      'call-transcripts',
      transcriptPath
    );
    transcript = JSON.parse(transcriptBuffer.toString('utf8'));
  } catch (error) {
    throw new Error(
      `Failed to download transcript: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  // 2. Get CDR metadata for context
  const { data: cdr, error: cdrError } = await supabase
    .from('cdr_records')
    .select('call_direction, duration_seconds, src, dst')
    .eq('id', cdrRecordId)
    .single();

  if (cdrError || !cdr) {
    throw new Error(`CDR record not found: ${cdrError?.message || 'Unknown'}`);
  }

  // 3. Get tenant settings for custom keywords
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('ai_custom_keywords')
    .eq('id', tenantId)
    .single();

  if (tenantError) {
    console.warn(
      `[Analyze] Failed to get tenant settings: ${tenantError.message}`
    );
  }

  const customKeywords: string[] = tenant?.ai_custom_keywords || [];

  // 4. Analyze call with Claude
  console.log(`[Analyze] Sending to Claude AI...`);

  let analysis: CallAnalysisResult;
  const analyzeStartTime = Date.now();
  try {
    analysis = await analyzeCall(transcript, customKeywords, {
      direction: cdr.call_direction,
      duration: cdr.duration_seconds,
      src: cdr.src,
      dst: cdr.dst,
    });
  } catch (error) {
    throw new Error(
      `Claude AI analysis failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  const analyzeTime = Date.now() - analyzeStartTime;
  console.log(
    `[Analyze] Analysis complete in ${analyzeTime}ms - Sentiment: ${analysis.sentiment_overall} (${analysis.sentiment_score.toFixed(2)})`
  );

  // 5. Upload analysis JSON to storage
  const storagePathPrefix = `${tenantId}/${cdrRecordId}`;
  const analysisPath = `${storagePathPrefix}/analysis.json`;

  console.log(`[Analyze] Uploading analysis to: ${analysisPath}`);

  try {
    const analysisJson = JSON.stringify(analysis, null, 2);
    await uploadToStorage(
      'call-analyses',
      analysisPath,
      Buffer.from(analysisJson, 'utf8'),
      'application/json'
    );
  } catch (error) {
    throw new Error(
      `Failed to upload analysis JSON: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  // 6. Insert call_analyses record
  console.log(`[Analyze] Inserting call analysis record...`);

  const { data: callAnalysis, error: insertError } = await supabase
    .from('call_analyses')
    .insert({
      cdr_record_id: cdrRecordId,
      tenant_id: tenantId,
      summary: analysis.summary,
      sentiment_overall: analysis.sentiment_overall,
      sentiment_score: analysis.sentiment_score,
      sentiment_timeline: analysis.sentiment_timeline,
      talk_ratio_caller: analysis.talk_ratio.caller,
      talk_ratio_agent: analysis.talk_ratio.agent,
      talk_time_caller_seconds: analysis.talk_time_seconds.caller,
      talk_time_agent_seconds: analysis.talk_time_seconds.agent,
      silence_seconds: analysis.silence_seconds,
      keywords: analysis.keywords,
      topics: analysis.topics,
      action_items: analysis.action_items,
      call_disposition_ai: analysis.call_disposition_ai,
      compliance_score: analysis.compliance_score,
      compliance_flags: analysis.compliance_flags,
      escalation_risk: analysis.escalation_risk,
      escalation_reasons: analysis.escalation_reasons,
      satisfaction_prediction: analysis.satisfaction_prediction,
      satisfaction_score: analysis.satisfaction_score,
      questions_asked: analysis.questions_asked,
      objections: analysis.objections,
      custom_keyword_matches: analysis.custom_keyword_matches,
      analysis_storage_path: analysisPath,
    })
    .select()
    .single();

  if (insertError || !callAnalysis) {
    throw new Error(
      `Failed to insert call analysis: ${insertError?.message || 'Unknown'}`
    );
  }

  console.log(`[Analyze] Analysis record created: ${callAnalysis.id}`);

  // 7. Update CDR record with analysis reference
  const { error: updateError } = await supabase
    .from('cdr_records')
    .update({
      analysis_storage_path: analysisPath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cdrRecordId);

  if (updateError) {
    console.error(`[Analyze] Failed to update CDR record: ${updateError.message}`);
    // Don't throw - analysis is saved, this is just a reference
  }

  return {
    analysisPath,
    callAnalysisId: callAnalysis.id,
    sentimentOverall: analysis.sentiment_overall,
    sentimentScore: analysis.sentiment_score,
  };
}
