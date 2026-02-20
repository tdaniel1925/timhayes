/**
 * Single User API Routes
 * GET /api/users/[id] - Get user by ID
 * PATCH /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user (also removes from Supabase Auth)
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getUserById, updateUser, deleteUser } from '@/lib/db/queries/users';
import { updateUserSchema } from '@/lib/validations/user';
import { createServerClient } from '@/lib/supabase/server';
import { AppError, API_ERRORS } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/users/[id]
 * Get user by ID (super_admin only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;
    const user = await getUserById(id);

    if (!user) {
      return handleApiError(new AppError('User not found', 'CB-API-007', 404));
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/users/[id]
 * Update user (super_admin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // If email is being updated, update in Supabase Auth too
    if (validatedData.email) {
      const supabase = await createServerClient();

      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: validatedData.email,
      });

      if (authError) {
        throw new AppError(
          `Failed to update auth email: ${authError.message}`,
          'CB-AUTH-006',
          400,
          authError
        );
      }
    }

    // Update the user in database
    const user = await updateUser(id, validatedData);

    if (!user) {
      return handleApiError(new AppError('User not found', 'CB-API-007', 404));
    }

    return successResponse(user, { updated: true });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(
        new AppError('Validation failed', API_ERRORS.PAYLOAD_VALIDATION_FAILED.code, 400, error)
      );
    }

    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Delete user from both database and Supabase Auth (super_admin only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Delete from Supabase Auth first
    const supabase = await createServerClient();

    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
      // Continue anyway - user record will be deleted
    }

    // Delete the user from database
    const user = await deleteUser(id);

    if (!user) {
      return handleApiError(new AppError('User not found', 'CB-API-007', 404));
    }

    return successResponse(user, { deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
