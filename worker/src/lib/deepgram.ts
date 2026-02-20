/**
 * Deepgram API integration for audio transcription
 * Uses Nova-2 model with speaker diarization
 */

import { createClient } from '@deepgram/sdk';

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY environment variable is not set');
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export interface TranscriptUtterance {
  speaker: number;
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: number;
  }>;
}

export interface TranscriptResult {
  text: string; // Full transcript text
  utterances: TranscriptUtterance[];
  speakers: number; // Number of speakers detected
  duration: number; // Audio duration in seconds
  wordCount: number;
  confidence: number; // Overall confidence
}

/**
 * Transcribe audio file with speaker diarization
 */
export async function transcribeAudio(
  audioBuffer: Buffer
): Promise<TranscriptResult> {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        language: 'en',
        smart_format: true,
        diarize: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
        detect_language: false, // We know it's English for phone calls
      }
    );

    if (error) {
      throw new Error(`Deepgram transcription failed: ${error.message}`);
    }

    if (!result?.results?.channels?.[0]) {
      throw new Error('No transcription results returned from Deepgram');
    }

    const channel = result.results.channels[0];
    const alternatives = channel.alternatives?.[0];

    if (!alternatives) {
      throw new Error('No transcript alternatives returned');
    }

    // Extract full transcript text
    const text = alternatives.transcript || '';

    // Extract utterances with speaker labels
    const utterances: TranscriptUtterance[] = (alternatives.paragraphs?.paragraphs || [])
      .flatMap((paragraph: any) => paragraph.sentences || [])
      .map((sentence: any) => ({
        speaker: sentence.speaker ?? 0,
        text: sentence.text || '',
        start: sentence.start ?? 0,
        end: sentence.end ?? 0,
        confidence: sentence.confidence ?? 0,
        words: (sentence.words || []).map((word: any) => ({
          word: word.word || '',
          start: word.start ?? 0,
          end: word.end ?? 0,
          confidence: word.confidence ?? 0,
          speaker: word.speaker,
        })),
      }));

    // Determine number of unique speakers
    const speakerSet = new Set(utterances.map((u) => u.speaker));
    const speakers = speakerSet.size;

    // Calculate duration from last word end time
    const duration =
      result.results.channels[0].alternatives[0].words?.slice(-1)[0]?.end || 0;

    // Count total words
    const wordCount = alternatives.words?.length || 0;

    // Overall confidence
    const confidence = alternatives.confidence || 0;

    return {
      text,
      utterances,
      speakers,
      duration,
      wordCount,
      confidence,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transcription error: ${error.message}`);
    }
    throw new Error('Unknown transcription error');
  }
}

/**
 * Format transcript for display with speaker labels
 */
export function formatTranscriptForDisplay(result: TranscriptResult): string {
  return result.utterances
    .map((utterance) => {
      const timestamp = formatTimestamp(utterance.start);
      return `[${timestamp}] Speaker ${utterance.speaker + 1}: ${utterance.text}`;
    })
    .join('\n\n');
}

/**
 * Format seconds to MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
