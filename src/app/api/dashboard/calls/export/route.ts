import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { cdrRecords, callAnalyses } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const disposition = searchParams.get('disposition');

    const db = db;

    // Build query
    let query = db
      .select({
        id: cdrRecords.id,
        startTime: cdrRecords.startTime,
        src: cdrRecords.src,
        dst: cdrRecords.dst,
        callerName: cdrRecords.callerName,
        durationSeconds: cdrRecords.durationSeconds,
        billsecSeconds: cdrRecords.billsecSeconds,
        disposition: cdrRecords.disposition,
        callDirection: cdrRecords.callDirection,
        summary: callAnalyses.summary,
        sentimentOverall: callAnalyses.sentimentOverall,
        keywords: callAnalyses.keywords,
      })
      .from(cdrRecords)
      .leftJoin(callAnalyses, eq(cdrRecords.id, callAnalyses.cdrRecordId))
      .orderBy(desc(cdrRecords.startTime))
      .limit(1000); // Limit to 1000 records for export

    // Apply filters
    const conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(cdrRecords.startTime, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(cdrRecords.startTime, new Date(endDate)));
    }

    if (disposition) {
      conditions.push(eq(cdrRecords.disposition, disposition as any));
    }

    // Execute query
    const calls = await query;

    // Generate CSV
    const headers = [
      'Date',
      'Time',
      'From',
      'To',
      'Caller Name',
      'Duration',
      'Talk Time',
      'Disposition',
      'Direction',
      'Sentiment',
      'Summary',
      'Keywords',
    ];

    const csvRows = [
      headers.join(','),
      ...calls.map((call) => {
        const date = new Date(call.startTime);
        const keywords = Array.isArray(call.keywords)
          ? call.keywords.map((k: any) => k.keyword || k).join('; ')
          : '';

        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          call.src || '',
          call.dst || '',
          call.callerName ? `"${call.callerName}"` : '',
          formatDuration(call.durationSeconds || 0),
          formatDuration(call.billsecSeconds || 0),
          call.disposition || '',
          call.callDirection || '',
          call.sentimentOverall || '',
          call.summary ? `"${call.summary.replace(/"/g, '""')}"` : '',
          keywords ? `"${keywords}"` : '',
        ].join(',');
      }),
    ];

    const csv = csvRows.join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="calls-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting calls:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
