import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { customKeywords, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    // Get keywords
    const keywords = await db
      .select()
      .from(customKeywords)
      .where(eq(customKeywords.tenantId, userRecord.tenantId));

    return NextResponse.json({ data: keywords });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

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
    const { keyword, category } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: { message: 'Keyword is required' } },
        { status: 400 }
      );
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

    // Create keyword
    const [newKeyword] = await db
      .insert(customKeywords)
      .values({
        tenantId: userRecord.tenantId,
        keyword: keyword.toLowerCase().trim(),
        category: category || 'Custom',
        isActive: true,
      })
      .returning();

    return NextResponse.json({ data: newKeyword }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating keyword:', error);

    if (error.code === '23505') {
      // Unique constraint violation
      return NextResponse.json(
        { error: { message: 'This keyword already exists' } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
