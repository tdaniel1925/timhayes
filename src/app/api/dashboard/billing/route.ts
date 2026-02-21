import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { billingEvents, cdrRecords, tenants, users } from '@/lib/db/schema';
import { eq, sql, gte } from 'drizzle-orm';

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

    const db = db;

    // Get user's tenant
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const [userRecord] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, userData.user.id))
      .limit(1);

    if (!userRecord || !userRecord.tenantId) {
      return NextResponse.json({ error: { message: 'No tenant found' } }, { status: 404 });
    }

    // Get tenant info
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, userRecord.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: { message: 'Tenant not found' } }, { status: 404 });
    }

    // Get current month usage
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [currentMonthStats] = await db
      .select({
        callCount: sql<number>`COUNT(*)`,
      })
      .from(cdrRecords)
      .where(
        sql`${cdrRecords.tenantId} = ${userRecord.tenantId} AND ${cdrRecords.startTime} >= ${currentMonthStart}`
      );

    const callCount = Number(currentMonthStats?.callCount || 0);
    const monthlyCharge = tenant.monthlyRateCents;
    const perCallCharge = callCount * tenant.perCallRateCents;
    const totalCharge = monthlyCharge + perCallCharge;

    // Get billing history
    const billingHistory = await db
      .select({
        id: billingEvents.id,
        billingMonth: billingEvents.billingMonth,
        callCount: billingEvents.callCount,
        totalCharge: billingEvents.totalChargeCents,
        status: billingEvents.status,
      })
      .from(billingEvents)
      .where(eq(billingEvents.tenantId, userRecord.tenantId))
      .orderBy(sql`${billingEvents.billingMonth} DESC`)
      .limit(12);

    const formattedHistory = billingHistory.map((event) => ({
      id: event.id,
      month: new Date(event.billingMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      callCount: event.callCount,
      totalCharge: event.totalCharge,
      status: event.status,
    }));

    return NextResponse.json({
      data: {
        currentMonth: {
          callCount,
          monthlyCharge,
          perCallCharge,
          totalCharge,
        },
        history: formattedHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
