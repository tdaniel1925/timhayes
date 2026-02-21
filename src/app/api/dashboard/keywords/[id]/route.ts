import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { customKeywords, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
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

    // Delete keyword (only if it belongs to user's tenant)
    const result = await db
      .delete(customKeywords)
      .where(
        and(
          eq(customKeywords.id, id),
          eq(customKeywords.tenantId, userRecord.tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: { message: 'Keyword not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
