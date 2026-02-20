import { z } from 'zod';

/**
 * Grandstream CDR Real-Time Output webhook payload validation
 *
 * This schema validates incoming webhook data from Grandstream UCM systems.
 * Fields are based on Grandstream's CDR Real-Time Output format.
 */
export const grandstreamWebhookSchema = z.object({
  accountcode: z.string().optional().default(''),
  src: z.string(),
  dst: z.string(),
  dcontext: z.string(),
  clid: z.string().optional().default(''),
  channel: z.string().optional().default(''),
  dstchannel: z.string().optional().default(''),
  lastapp: z.string().optional().default(''),
  lastdata: z.string().optional().default(''),
  start: z.string(), // e.g., "2026-02-14 10:30:00"
  answer: z.string().optional().default(''),
  end: z.string().optional().default(''),
  duration: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  billsec: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  disposition: z.enum(['ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED', 'CONGESTION']),
  amaflags: z.string().optional().default(''),
  uniqueid: z.string().optional().default(''),
  userfield: z.string().optional().default(''),
  channel_ext: z.string().optional().default(''),
  dstchannel_ext: z.string().optional().default(''),
  service: z.string().optional().default(''),
  caller_name: z.string().optional().default(''),
  recordfiles: z.string().optional().default(''),
  dstanswer: z.string().optional().default(''),
  chanext: z.string().optional().default(''),
  dstchanext: z.string().optional().default(''),
  session: z.string().optional().default(''),
  action_owner: z.string().optional().default(''),
  action_type: z.string().optional().default(''),
  src_trunk_name: z.string().optional().default(''),
  dst_trunk_name: z.string().optional().default(''),
});

export type GrandstreamWebhookPayload = z.infer<typeof grandstreamWebhookSchema>;

/**
 * Generic webhook payload validation for non-Grandstream PBX systems
 *
 * This schema provides a standardized format for any PBX system
 * to send call detail records to AudiaPro.
 */
export const genericWebhookSchema = z.object({
  call_id: z.string(),
  direction: z.enum(['inbound', 'outbound', 'internal']),
  from: z.string(),
  to: z.string(),
  caller_name: z.string().optional().default(''),
  start_time: z.string(), // ISO 8601 format
  end_time: z.string().optional(), // ISO 8601 format
  duration: z.number().int().nonnegative(), // Total duration in seconds
  billsec: z.number().int().nonnegative().optional(), // Talk time in seconds
  status: z.enum(['answered', 'missed', 'busy', 'failed']),
  recording_url: z.string().url().optional(),
  recording_filename: z.string().optional(),
});

export type GenericWebhookPayload = z.infer<typeof genericWebhookSchema>;

/**
 * Determines call direction from Grandstream CDR data
 *
 * Logic:
 * - If dcontext contains "from-internal" AND dst_trunk_name exists → outbound
 * - If src_trunk_name exists → inbound
 * - Otherwise → internal
 */
export function determineCallDirection(
  dcontext: string,
  srcTrunkName: string,
  dstTrunkName: string
): 'inbound' | 'outbound' | 'internal' {
  if (dcontext.includes('from-internal') && dstTrunkName) {
    return 'outbound';
  }
  if (srcTrunkName) {
    return 'inbound';
  }
  return 'internal';
}

/**
 * Maps Grandstream disposition to our standard enum values
 */
export function mapGrandstreamDisposition(
  disposition: string
): 'answered' | 'no_answer' | 'busy' | 'failed' | 'congestion' {
  const upperDisposition = disposition.toUpperCase();

  switch (upperDisposition) {
    case 'ANSWERED':
      return 'answered';
    case 'NO ANSWER':
      return 'no_answer';
    case 'BUSY':
      return 'busy';
    case 'FAILED':
      return 'failed';
    case 'CONGESTION':
      return 'congestion';
    default:
      return 'failed';
  }
}

/**
 * Maps generic status to our standard disposition enum
 */
export function mapGenericStatus(
  status: string
): 'answered' | 'no_answer' | 'busy' | 'failed' {
  switch (status) {
    case 'answered':
      return 'answered';
    case 'missed':
      return 'no_answer';
    case 'busy':
      return 'busy';
    case 'failed':
      return 'failed';
    default:
      return 'failed';
  }
}

/**
 * Parses Grandstream timestamp format to ISO 8601
 * Input: "2026-02-14 10:30:00"
 * Output: ISO 8601 string
 */
export function parseGrandstreamTimestamp(timestamp: string): string | null {
  if (!timestamp || timestamp.trim() === '') {
    return null;
  }

  try {
    // Grandstream format: "YYYY-MM-DD HH:MM:SS"
    // Convert to ISO 8601
    const date = new Date(timestamp.replace(' ', 'T'));
    return date.toISOString();
  } catch (error) {
    console.error('Failed to parse Grandstream timestamp:', timestamp, error);
    return null;
  }
}
