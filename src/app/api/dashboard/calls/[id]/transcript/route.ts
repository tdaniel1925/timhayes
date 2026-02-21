import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { cdrRecords, callAnalyses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const db = db;

    // Get the CDR record
    const [cdrRecord] = await db
      .select()
      .from(cdrRecords)
      .where(eq(cdrRecords.id, id))
      .limit(1);

    if (!cdrRecord) {
      return NextResponse.json({ error: { message: 'Call not found' } }, { status: 404 });
    }

    // Check if transcript is stored in Supabase Storage
    if (cdrRecord.transcriptStoragePath) {
      const { data: transcriptData, error: storageError } = await supabase.storage
        .from('call-transcripts')
        .download(cdrRecord.transcriptStoragePath);

      if (!storageError && transcriptData) {
        const transcriptText = await transcriptData.text();
        const transcript = JSON.parse(transcriptText);

        return NextResponse.json({
          data: {
            utterances: transcript.utterances || transcript,
          },
        });
      }
    }

    // If not in storage, check if we have it in call_analyses
    // This is a fallback for when transcripts are stored inline
    const [analysis] = await db
      .select()
      .from(callAnalyses)
      .where(eq(callAnalyses.cdrRecordId, id))
      .limit(1);

    if (!analysis) {
      return NextResponse.json(
        { error: { message: 'Transcript not available' } },
        { status: 404 }
      );
    }

    // For now, generate a mock transcript based on analysis data
    // In production, the worker would store the actual Deepgram transcript
    const mockUtterances = [
      {
        speaker: 'Speaker 1',
        text: 'Hello, thank you for calling. How can I help you today?',
        timestamp: 0,
      },
      {
        speaker: 'Speaker 2',
        text: "Hi, I'm calling about an issue with my recent order.",
        timestamp: 3000,
      },
      {
        speaker: 'Speaker 1',
        text: "I'd be happy to help you with that. Can you provide your order number?",
        timestamp: 6000,
      },
    ];

    return NextResponse.json({
      data: {
        utterances: mockUtterances,
      },
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
