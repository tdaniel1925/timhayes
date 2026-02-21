import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { cdrRecords, callAnalyses } from '@/lib/db/schema';
import { eq, gte, lte, desc, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;


    // Get summary statistics
    const [stats] = await db
      .select({
        totalCalls: sql<number>`COUNT(*)`,
        answeredCalls: sql<number>`COUNT(*) FILTER (WHERE ${cdrRecords.disposition} = 'answered')`,
        avgDuration: sql<number>`AVG(${cdrRecords.billsecSeconds})`,
        positiveSentiment: sql<number>`COUNT(*) FILTER (WHERE ${callAnalyses.sentimentOverall} = 'positive')`,
        negativeSentiment: sql<number>`COUNT(*) FILTER (WHERE ${callAnalyses.sentimentOverall} = 'negative')`,
      })
      .from(cdrRecords)
      .leftJoin(callAnalyses, eq(cdrRecords.id, callAnalyses.cdrRecordId))
      .where(
        startDate && endDate
          ? sql`${cdrRecords.startTime} >= ${new Date(startDate)} AND ${cdrRecords.startTime} <= ${new Date(endDate)}`
          : sql`1=1`
      );

    // Get top calls
    const topCalls = await db
      .select({
        startTime: cdrRecords.startTime,
        src: cdrRecords.src,
        dst: cdrRecords.dst,
        durationSeconds: cdrRecords.durationSeconds,
        sentiment: callAnalyses.sentimentOverall,
        summary: callAnalyses.summary,
      })
      .from(cdrRecords)
      .leftJoin(callAnalyses, eq(cdrRecords.id, callAnalyses.cdrRecordId))
      .where(
        startDate && endDate
          ? sql`${cdrRecords.startTime} >= ${new Date(startDate)} AND ${cdrRecords.startTime} <= ${new Date(endDate)}`
          : sql`1=1`
      )
      .orderBy(desc(cdrRecords.startTime))
      .limit(10);

    // Create PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(24)
      .fillColor('#FF7F50')
      .text('AudiaPro', { align: 'left' })
      .moveDown(0.5);

    doc
      .fontSize(18)
      .fillColor('#000000')
      .text('Call Analytics Report', { align: 'left' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        `Report Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'All Time'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Today'}`,
        { align: 'left' }
      )
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'left' })
      .moveDown(1);

    // Summary Statistics
    doc.fontSize(14).fillColor('#000000').text('Summary Statistics').moveDown(0.5);

    const summaryData = [
      ['Total Calls', stats?.totalCalls?.toString() || '0'],
      ['Answered Calls', stats?.answeredCalls?.toString() || '0'],
      [
        'Answer Rate',
        `${stats?.totalCalls ? ((stats.answeredCalls / stats.totalCalls) * 100).toFixed(1) : 0}%`,
      ],
      [
        'Avg Duration',
        `${Math.floor((stats?.avgDuration || 0) / 60)}:${Math.floor((stats?.avgDuration || 0) % 60).toString().padStart(2, '0')}`,
      ],
      ['Positive Sentiment', stats?.positiveSentiment?.toString() || '0'],
      ['Negative Sentiment', stats?.negativeSentiment?.toString() || '0'],
    ];

    let yPosition = doc.y;
    summaryData.forEach(([label, value]) => {
      doc.fontSize(10).fillColor('#333333').text(label, 50, yPosition, { width: 250 });
      doc.fontSize(12).fillColor('#000000').text(value, 320, yPosition, { width: 250 });
      yPosition += 25;
    });

    doc.moveDown(2);

    // Top Calls Table
    doc.fontSize(14).fillColor('#000000').text('Recent Calls').moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text('Date', 50, tableTop, { width: 80 })
      .text('From', 130, tableTop, { width: 80 })
      .text('To', 210, tableTop, { width: 80 })
      .text('Duration', 290, tableTop, { width: 60 })
      .text('Sentiment', 350, tableTop, { width: 80 });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    let tableY = tableTop + 25;

    topCalls.forEach((call) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 50;
      }

      const date = new Date(call.startTime);
      const duration = call.durationSeconds
        ? `${Math.floor(call.durationSeconds / 60)}:${(call.durationSeconds % 60).toString().padStart(2, '0')}`
        : '-';

      doc
        .fontSize(8)
        .fillColor('#000000')
        .text(date.toLocaleDateString(), 50, tableY, { width: 80 })
        .text(call.src || '-', 130, tableY, { width: 80 })
        .text(call.dst || '-', 210, tableY, { width: 80 })
        .text(duration, 290, tableY, { width: 60 })
        .text(call.sentiment || '-', 350, tableY, { width: 80 });

      if (call.summary) {
        tableY += 15;
        doc
          .fontSize(7)
          .fillColor('#666666')
          .text(call.summary.substring(0, 100) + '...', 50, tableY, { width: 500 });
      }

      tableY += 30;
    });

    // Footer
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text('Powered by AudiaPro - BotMakers Inc.', 50, 750, {
        align: 'center',
        width: 500,
      });

    doc.end();

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audiapro-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
