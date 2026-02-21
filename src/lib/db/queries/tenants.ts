/**
 * Database query functions for tenants table
 */

import { eq, desc } from 'drizzle-orm';
import { db } from '../index';
import { tenants } from '../schema';
import { AppError, DB_ERRORS, createError } from '@/lib/errors';
import type { CreateTenantInput, UpdateTenantInput } from '@/lib/validations/tenant';

/**
 * Get all tenants
 */
export async function getAllTenants() {
  try {
    const result = await Promise.race([
      db.select().from(tenants).orderBy(desc(tenants.createdAt)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]);
    return result as any[];
  } catch (error) {
    console.error('[getAllTenants] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get a tenant by ID
 */
export async function getTenantById(id: string) {
  try {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get a tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  try {
    const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Create a new tenant
 */
export async function createTenant(data: CreateTenantInput) {
  try {
    const result = await db
      .insert(tenants)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error: any) {
    // Check for unique constraint violation on slug
    if (error?.code === '23505' && error?.constraint?.includes('slug')) {
      throw new AppError('A tenant with this slug already exists', DB_ERRORS.UNIQUE_CONSTRAINT_VIOLATION.code, 409);
    }
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update a tenant
 */
export async function updateTenant(id: string, data: UpdateTenantInput) {
  try {
    const result = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update tenant status
 */
export async function updateTenantStatus(id: string, status: 'active' | 'suspended' | 'cancelled') {
  try {
    const result = await db
      .update(tenants)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Delete a tenant (soft delete by setting status to 'cancelled')
 */
export async function deleteTenant(id: string) {
  try {
    const result = await db
      .update(tenants)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Get tenant count by status
 */
export async function getTenantCountByStatus() {
  try {
    const allTenants = await db.select().from(tenants);

    const counts = {
      active: 0,
      suspended: 0,
      cancelled: 0,
      total: allTenants.length,
    };

    allTenants.forEach((tenant) => {
      if (tenant.status === 'active') counts.active++;
      else if (tenant.status === 'suspended') counts.suspended++;
      else if (tenant.status === 'cancelled') counts.cancelled++;
    });

    return counts;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}
