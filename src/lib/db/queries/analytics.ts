/**
 * Database query functions for analytics and statistics
 */

import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { db } from '../index';
import { cdrRecords, callAnalyses, tenants } from '../schema';
import { createError, DB_ERRORS } from '@/lib/errors';

/**
 * Get dashboard statistics for a tenant
 */
export async function getTenantDashboardStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  try {
    // Build date filter
    const dateFilter = dateFrom && dateTo
      ? and(
          eq(cdrRecords.tenantId, tenantId),
          gte(cdrRecords.startTime, dateFrom),
          lte(cdrRecords.startTime, dateTo)
        )
      : eq(cdrRecords.tenantId, tenantId);

    // Get total calls
    const calls = await db
      .select()
      .from(cdrRecords)
      .where(dateFilter);

    // Get calls with analysis
    const callsWithAnalysis = await db
      .select({
        sentiment: callAnalyses.sentimentOverall,
        satisfactionPrediction: callAnalyses.satisfactionPrediction,
        escalationRisk: callAnalyses.escalationRisk,
        cdrId: callAnalyses.cdrRecordId,
      })
      .from(callAnalyses)
      .innerJoin(cdrRecords, eq(callAnalyses.cdrRecordId, cdrRecords.id))
      .where(dateFilter);

    // Calculate statistics
    const totalCalls = calls.length;
    const answeredCalls = calls.filter(c => c.disposition === 'answered').length;
    const avgDuration = calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / calls.length)
      : 0;

    // Sentiment distribution
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
      mixed: 0,
    };
    callsWithAnalysis.forEach(c => {
      if (c.sentiment) sentimentCounts[c.sentiment]++;
    });

    // Satisfaction distribution
    const satisfactionCounts = {
      satisfied: 0,
      neutral: 0,
      dissatisfied: 0,
    };
    callsWithAnalysis.forEach(c => {
      if (c.satisfactionPrediction) satisfactionCounts[c.satisfactionPrediction]++;
    });

    // Escalation risk distribution
    const escalationCounts = {
      low: 0,
      medium: 0,
      high: 0,
    };
    callsWithAnalysis.forEach(c => {
      if (c.escalationRisk) escalationCounts[c.escalationRisk]++;
    });

    // Pending analysis count
    const pendingAnalysis = calls.filter(c => c.analysisStatus === 'pending').length;

    return {
      totalCalls,
      answeredCalls,
      avgDuration,
      pendingAnalysis,
      sentiment: sentimentCounts,
      satisfaction: satisfactionCounts,
      escalation: escalationCounts,
      answerRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
    };
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get calls for a tenant with pagination and filters
 */
export async function getTenantCalls(
  tenantId: string,
  options: {
    page?: number;
    pageSize?: number;
    disposition?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
) {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Build filters
    const filters = [eq(cdrRecords.tenantId, tenantId)];

    if (options.disposition) {
      filters.push(eq(cdrRecords.disposition, options.disposition as any));
    }

    if (options.dateFrom) {
      filters.push(gte(cdrRecords.startTime, options.dateFrom));
    }

    if (options.dateTo) {
      filters.push(lte(cdrRecords.startTime, options.dateTo));
    }

    const whereClause = and(...filters);

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(cdrRecords)
      .where(whereClause);

    // Get paginated calls
    const calls = await db
      .select()
      .from(cdrRecords)
      .where(whereClause)
      .orderBy(desc(cdrRecords.startTime))
      .limit(pageSize)
      .offset(offset);

    return {
      data: calls,
      meta: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get call detail with analysis
 */
export async function getCallDetail(callId: string, tenantId: string) {
  try {
    const call = await db
      .select()
      .from(cdrRecords)
      .where(and(eq(cdrRecords.id, callId), eq(cdrRecords.tenantId, tenantId)))
      .limit(1);

    if (!call[0]) {
      return null;
    }

    // Get analysis if exists
    const analysis = await db
      .select()
      .from(callAnalyses)
      .where(eq(callAnalyses.cdrRecordId, callId))
      .limit(1);

    return {
      call: call[0],
      analysis: analysis[0] || null,
    };
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get all calls across all tenants (super admin only)
 */
export async function getAllCalls(options: {
  page?: number;
  pageSize?: number;
  tenantId?: string;
  disposition?: string;
  dateFrom?: Date;
  dateTo?: Date;
} = {}) {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Build filters
    const filters = [];

    if (options.tenantId) {
      filters.push(eq(cdrRecords.tenantId, options.tenantId));
    }

    if (options.disposition) {
      filters.push(eq(cdrRecords.disposition, options.disposition as any));
    }

    if (options.dateFrom) {
      filters.push(gte(cdrRecords.startTime, options.dateFrom));
    }

    if (options.dateTo) {
      filters.push(lte(cdrRecords.startTime, options.dateTo));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(cdrRecords)
      .where(whereClause);

    // Get paginated calls with tenant info
    const calls = await db
      .select({
        id: cdrRecords.id,
        tenantId: cdrRecords.tenantId,
        tenantName: tenants.name,
        src: cdrRecords.src,
        dst: cdrRecords.dst,
        callerName: cdrRecords.callerName,
        startTime: cdrRecords.startTime,
        endTime: cdrRecords.endTime,
        durationSeconds: cdrRecords.durationSeconds,
        disposition: cdrRecords.disposition,
        recordingFilename: cdrRecords.recordingFilename,
        transcriptStatus: cdrRecords.transcriptStatus,
        analysisStatus: cdrRecords.analysisStatus,
      })
      .from(cdrRecords)
      .leftJoin(tenants, eq(cdrRecords.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(cdrRecords.startTime))
      .limit(pageSize)
      .offset(offset);

    return {
      data: calls,
      meta: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get call volume trend data (daily aggregates)
 */
export async function getCallVolumeTrend(tenantId: string, days: number = 30) {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`DATE(${cdrRecords.startTime})`,
        total: count(),
        answered: sql<number>`COUNT(CASE WHEN ${cdrRecords.disposition} = 'answered' THEN 1 END)`,
      })
      .from(cdrRecords)
      .where(
        and(
          eq(cdrRecords.tenantId, tenantId),
          gte(cdrRecords.startTime, dateFrom)
        )
      )
      .groupBy(sql`DATE(${cdrRecords.startTime})`)
      .orderBy(sql`DATE(${cdrRecords.startTime})`);

    return result;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}
