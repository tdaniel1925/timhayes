/**
 * Database query functions for users table
 */

import { eq, desc, and } from 'drizzle-orm';
import { db } from '../index';
import { users, tenants } from '../schema';
import { AppError, DB_ERRORS, createError } from '@/lib/errors';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations/user';

/**
 * Get all users with tenant info
 */
export async function getAllUsers() {
  try {
    return await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(desc(users.createdAt));
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get users for a specific tenant
 */
export async function getUsersByTenantId(tenantId: string) {
  try {
    return await db
      .select()
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt));
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Create a new user record in the database
 * Note: Supabase Auth user creation happens separately in the API route
 */
export async function createUser(id: string, data: Omit<CreateUserInput, 'password'>) {
  try {
    const result = await db
      .insert(users)
      .values({
        id, // This comes from Supabase Auth
        tenantId: data.tenantId || null,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error: any) {
    // Check for unique constraint violation on email
    if (error?.code === '23505' && error?.constraint?.includes('email')) {
      throw new AppError('A user with this email already exists', DB_ERRORS.UNIQUE_CONSTRAINT_VIOLATION.code, 409);
    }
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update a user
 */
export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  } catch (error: any) {
    // Check for unique constraint violation on email
    if (error?.code === '23505' && error?.constraint?.includes('email')) {
      throw new AppError('A user with this email already exists', DB_ERRORS.UNIQUE_CONSTRAINT_VIOLATION.code, 409);
    }
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update user active status
 */
export async function updateUserActiveStatus(id: string, isActive: boolean) {
  try {
    const result = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update user last login timestamp
 */
export async function updateUserLastLogin(id: string) {
  try {
    const result = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Delete a user (also removes from Supabase Auth in the API route)
 */
export async function deleteUser(id: string) {
  try {
    const result = await db.delete(users).where(eq(users.id, id)).returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Get user count by role
 */
export async function getUserCountByRole() {
  try {
    const allUsers = await db.select().from(users).where(eq(users.isActive, true));

    const counts = {
      super_admin: 0,
      client_admin: 0,
      total: allUsers.length,
    };

    allUsers.forEach((user) => {
      if (user.role === 'super_admin') counts.super_admin++;
      else if (user.role === 'client_admin') counts.client_admin++;
    });

    return counts;
  } catch (error) {
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}
