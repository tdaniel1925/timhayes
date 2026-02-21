/**
 * Email Reports Cron Job
 * Sends scheduled analytics reports to users
 */

import { supabase } from '../lib/supabase.js';
import { Resend } from 'resend';
import postgres from 'postgres';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reports@audiapro.com';
const APP_NAME = 'AudiaPro';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://audiapro.com';

// Initialize direct Postgres connection for complex queries
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

interface EmailReport {
  id: string;
  tenant_id: string;
  user_id: string;
  report_type: 'daily_summary' | 'weekly_summary' | 'monthly_summary';
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  config_json: any;
  created_at: string;
  user_email: string;
  user_full_name: string;
  tenant_name: string;
}

interface ReportAnalytics {
  totalCalls: number;
  answeredCalls: number;
  avgDuration: number;
  avgSentimentScore: number;
  sentimentDistribution: { positive: number; negative: number; neutral: number; mixed: number };
  topKeywords: { keyword: string; count: number }[];
  escalationRiskCounts: { low: number; medium: number; high: number };
  avgComplianceScore: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Check and send due email reports
 */
export async function processEmailReports(): Promise<void> {
  if (!resend) {
    console.log('[EmailReports] Resend not configured, skipping email reports');
    return;
  }

  try {
    // Find all due reports (where next_send_at <= now)
    const now = new Date();
    const { data: dueReports, error } = await supabase
      .from('email_reports')
      .select(
        `
        *,
        users!inner(email, full_name),
        tenants!inner(name)
      `
      )
      .eq('is_active', true)
      .lte('next_send_at', now.toISOString());

    if (error) {
      console.error('[EmailReports] Error fetching due reports:', error);
      return;
    }

    if (!dueReports || dueReports.length === 0) {
      console.log('[EmailReports] No due reports to send');
      return;
    }

    console.log(`[EmailReports] Found ${dueReports.length} due reports`);

    // Process each report
    for (const report of dueReports) {
      try {
        await sendReport({
          id: report.id,
          tenant_id: report.tenant_id,
          user_id: report.user_id,
          report_type: report.report_type,
          is_active: report.is_active,
          last_sent_at: report.last_sent_at,
          next_send_at: report.next_send_at,
          config_json: report.config_json,
          created_at: report.created_at,
          user_email: report.users.email,
          user_full_name: report.users.full_name,
          tenant_name: report.tenants.name,
        });

        // Update last_sent_at and next_send_at
        const nextSendAt = calculateNextSendTime(report.report_type);
        await supabase
          .from('email_reports')
          .update({
            last_sent_at: now.toISOString(),
            next_send_at: nextSendAt.toISOString(),
          })
          .eq('id', report.id);

        console.log(`[EmailReports] Sent ${report.report_type} report to ${report.users.email}`);
      } catch (error) {
        console.error(
          `[EmailReports] Error sending report ${report.id}:`,
          error instanceof Error ? error.message : 'Unknown'
        );
      }
    }
  } catch (error) {
    console.error(
      '[EmailReports] Error in processEmailReports:',
      error instanceof Error ? error.message : 'Unknown'
    );
  }
}

/**
 * Send individual report
 */
async function sendReport(report: EmailReport): Promise<void> {
  if (!resend) return;

  // Calculate date range based on report type
  const { periodStart, periodEnd } = getReportPeriod(report.report_type);

  // Fetch analytics for the period
  const analytics = await fetchAnalytics(report.tenant_id, periodStart, periodEnd);

  // Generate email HTML
  const emailHtml = getReportEmailTemplate(
    report.user_full_name,
    report.tenant_name,
    report.report_type,
    analytics
  );

  // Send email
  const { error } = await resend.emails.send({
    from: `${APP_NAME} Reports <${FROM_EMAIL}>`,
    to: report.user_email,
    subject: getReportSubject(report.report_type, report.tenant_name),
    html: emailHtml,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Fetch analytics for report period
 */
async function fetchAnalytics(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ReportAnalytics> {
  try {
    // Fetch call statistics
    const calls = await sql`
      SELECT
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE disposition = 'answered') as answered_calls,
        ROUND(AVG(duration_seconds)) as avg_duration
      FROM cdr_records
      WHERE tenant_id = ${tenantId}
        AND start_time >= ${periodStart.toISOString()}
        AND start_time < ${periodEnd.toISOString()}
    `;

    // Fetch sentiment statistics
    const sentimentStats = await sql`
      SELECT
        AVG(CAST(sentiment_score AS FLOAT)) as avg_sentiment,
        COUNT(*) FILTER (WHERE sentiment_overall = 'positive') as positive_count,
        COUNT(*) FILTER (WHERE sentiment_overall = 'negative') as negative_count,
        COUNT(*) FILTER (WHERE sentiment_overall = 'neutral') as neutral_count,
        COUNT(*) FILTER (WHERE sentiment_overall = 'mixed') as mixed_count
      FROM call_analyses
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${periodStart.toISOString()}
        AND created_at < ${periodEnd.toISOString()}
    `;

    // Fetch top keywords
    const keywords = await sql`
      SELECT
        jsonb_array_elements(keywords)->>'keyword' as keyword,
        SUM((jsonb_array_elements(keywords)->>'count')::int) as total_count
      FROM call_analyses
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${periodStart.toISOString()}
        AND created_at < ${periodEnd.toISOString()}
        AND keywords IS NOT NULL
      GROUP BY keyword
      ORDER BY total_count DESC
      LIMIT 10
    `;

    // Fetch escalation risk stats
    const escalationStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE escalation_risk = 'low') as low_count,
        COUNT(*) FILTER (WHERE escalation_risk = 'medium') as medium_count,
        COUNT(*) FILTER (WHERE escalation_risk = 'high') as high_count
      FROM call_analyses
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${periodStart.toISOString()}
        AND created_at < ${periodEnd.toISOString()}
    `;

    // Fetch compliance stats
    const complianceStats = await sql`
      SELECT AVG(CAST(compliance_score AS FLOAT)) as avg_compliance
      FROM call_analyses
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${periodStart.toISOString()}
        AND created_at < ${periodEnd.toISOString()}
        AND compliance_score IS NOT NULL
    `;

    return {
      totalCalls: Number(calls[0]?.total_calls || 0),
      answeredCalls: Number(calls[0]?.answered_calls || 0),
      avgDuration: Number(calls[0]?.avg_duration || 0),
      avgSentimentScore: Number(sentimentStats[0]?.avg_sentiment || 0),
      sentimentDistribution: {
        positive: Number(sentimentStats[0]?.positive_count || 0),
        negative: Number(sentimentStats[0]?.negative_count || 0),
        neutral: Number(sentimentStats[0]?.neutral_count || 0),
        mixed: Number(sentimentStats[0]?.mixed_count || 0),
      },
      topKeywords: keywords.map((k: any) => ({
        keyword: k.keyword,
        count: Number(k.total_count),
      })),
      escalationRiskCounts: {
        low: Number(escalationStats[0]?.low_count || 0),
        medium: Number(escalationStats[0]?.medium_count || 0),
        high: Number(escalationStats[0]?.high_count || 0),
      },
      avgComplianceScore: Number(complianceStats[0]?.avg_compliance || 0),
      periodStart,
      periodEnd,
    };
  } catch (error) {
    console.error('[EmailReports] Error fetching analytics:', error);
    throw error;
  }
}

/**
 * Get report period based on type
 */
function getReportPeriod(reportType: string): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date = now;

  switch (reportType) {
    case 'daily_summary':
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;

    case 'weekly_summary':
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);
      periodStart.setHours(0, 0, 0, 0);
      break;

    case 'monthly_summary':
      periodStart = new Date(now);
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setHours(0, 0, 0, 0);
      break;

    default:
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 1);
  }

  return { periodStart, periodEnd };
}

/**
 * Calculate next send time based on report type
 */
function calculateNextSendTime(reportType: string): Date {
  const now = new Date();
  const nextSend = new Date(now);

  switch (reportType) {
    case 'daily_summary':
      // Send daily at 8 AM
      nextSend.setDate(nextSend.getDate() + 1);
      nextSend.setHours(8, 0, 0, 0);
      break;

    case 'weekly_summary':
      // Send weekly on Monday at 8 AM
      const daysUntilMonday = (8 - nextSend.getDay()) % 7 || 7;
      nextSend.setDate(nextSend.getDate() + daysUntilMonday);
      nextSend.setHours(8, 0, 0, 0);
      break;

    case 'monthly_summary':
      // Send monthly on 1st at 8 AM
      nextSend.setMonth(nextSend.getMonth() + 1);
      nextSend.setDate(1);
      nextSend.setHours(8, 0, 0, 0);
      break;

    default:
      nextSend.setDate(nextSend.getDate() + 1);
  }

  return nextSend;
}

/**
 * Get email subject based on report type
 */
function getReportSubject(reportType: string, tenantName: string): string {
  const typeLabel =
    reportType === 'daily_summary'
      ? 'Daily'
      : reportType === 'weekly_summary'
      ? 'Weekly'
      : 'Monthly';

  return `${APP_NAME} ${typeLabel} Analytics Report - ${tenantName}`;
}

/**
 * Generate report email HTML template
 */
function getReportEmailTemplate(
  fullName: string,
  tenantName: string,
  reportType: string,
  analytics: ReportAnalytics
): string {
  const periodLabel =
    reportType === 'daily_summary'
      ? 'Yesterday'
      : reportType === 'weekly_summary'
      ? 'Last 7 Days'
      : 'Last 30 Days';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const answerRate =
    analytics.totalCalls > 0
      ? Math.round((analytics.answeredCalls / analytics.totalCalls) * 100)
      : 0;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${APP_NAME} Analytics Report</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #F5F5F7; background-color: #0F1117; margin: 0; padding: 0;">
        <div style="max-width: 650px; margin: 40px auto; background-color: #1A1D27; border-radius: 12px; overflow: hidden; border: 1px solid #2E3142;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF7F50 0%, #E86840 100%); padding: 40px 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${APP_NAME} Analytics</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${periodLabel} Summary for ${tenantName}</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 30px 0;">
              Hello ${fullName},
            </p>

            <!-- Key Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
              <!-- Total Calls -->
              <div style="background-color: #242736; border-radius: 8px; padding: 20px; border-left: 4px solid #FF7F50;">
                <p style="color: #9CA3AF; margin: 0; font-size: 14px;">Total Calls</p>
                <p style="color: #F5F5F7; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">${analytics.totalCalls}</p>
              </div>

              <!-- Answer Rate -->
              <div style="background-color: #242736; border-radius: 8px; padding: 20px; border-left: 4px solid #22C55E;">
                <p style="color: #9CA3AF; margin: 0; font-size: 14px;">Answer Rate</p>
                <p style="color: #F5F5F7; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">${answerRate}%</p>
              </div>

              <!-- Avg Duration -->
              <div style="background-color: #242736; border-radius: 8px; padding: 20px; border-left: 4px solid #3B82F6;">
                <p style="color: #9CA3AF; margin: 0; font-size: 14px;">Avg Duration</p>
                <p style="color: #F5F5F7; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">${formatDuration(analytics.avgDuration)}</p>
              </div>

              <!-- Avg Sentiment -->
              <div style="background-color: #242736; border-radius: 8px; padding: 20px; border-left: 4px solid #F59E0B;">
                <p style="color: #9CA3AF; margin: 0; font-size: 14px;">Avg Sentiment</p>
                <p style="color: #F5F5F7; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">${analytics.avgSentimentScore.toFixed(2)}</p>
              </div>
            </div>

            <!-- Sentiment Distribution -->
            <div style="background-color: #242736; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #F5F5F7; margin: 0 0 20px 0; font-size: 18px;">Sentiment Distribution</h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div style="text-align: center;">
                  <p style="color: #22C55E; margin: 0; font-size: 24px; font-weight: 700;">${analytics.sentimentDistribution.positive}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Positive</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #EF4444; margin: 0; font-size: 24px; font-weight: 700;">${analytics.sentimentDistribution.negative}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Negative</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #9CA3AF; margin: 0; font-size: 24px; font-weight: 700;">${analytics.sentimentDistribution.neutral}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Neutral</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #3B82F6; margin: 0; font-size: 24px; font-weight: 700;">${analytics.sentimentDistribution.mixed}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Mixed</p>
                </div>
              </div>
            </div>

            ${
              analytics.topKeywords.length > 0
                ? `
            <!-- Top Keywords -->
            <div style="background-color: #242736; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #F5F5F7; margin: 0 0 20px 0; font-size: 18px;">Top Keywords</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${analytics.topKeywords
                  .map(
                    (kw) =>
                      `<span style="background-color: #1A1D27; color: #FF7F50; padding: 8px 16px; border-radius: 6px; font-size: 14px;">${kw.keyword} (${kw.count})</span>`
                  )
                  .join('')}
              </div>
            </div>
            `
                : ''
            }

            <!-- Escalation Risk -->
            <div style="background-color: #242736; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #F5F5F7; margin: 0 0 20px 0; font-size: 18px;">Escalation Risk</h3>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div style="text-align: center;">
                  <p style="color: #22C55E; margin: 0; font-size: 24px; font-weight: 700;">${analytics.escalationRiskCounts.low}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Low</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #F59E0B; margin: 0; font-size: 24px; font-weight: 700;">${analytics.escalationRiskCounts.medium}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">Medium</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #EF4444; margin: 0; font-size: 24px; font-weight: 700;">${analytics.escalationRiskCounts.high}</p>
                  <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 12px;">High</p>
                </div>
              </div>
            </div>

            ${
              analytics.avgComplianceScore > 0
                ? `
            <!-- Compliance Score -->
            <div style="background-color: #242736; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #F5F5F7; margin: 0 0 10px 0; font-size: 18px;">Average Compliance Score</h3>
              <p style="color: #22C55E; margin: 0; font-size: 36px; font-weight: 700;">${(analytics.avgComplianceScore * 100).toFixed(1)}%</p>
            </div>
            `
                : ''
            }

            <!-- CTA -->
            <div style="margin: 30px 0; text-align: center;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #FF7F50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Full Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #0F1117; padding: 30px; text-align: center; border-top: 1px solid #2E3142;">
            <p style="color: #9CA3AF; margin: 0; font-size: 14px;">
              You're receiving this because you subscribed to ${reportType.replace('_', ' ')} reports.
            </p>
            <p style="color: #9CA3AF; margin: 10px 0 0 0; font-size: 14px;">
              <a href="${APP_URL}/dashboard/settings" style="color: #FF7F50; text-decoration: none;">Manage Email Preferences</a>
            </p>
            <p style="color: #6B7280; margin: 20px 0 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} BotMakers Inc. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
