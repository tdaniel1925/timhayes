/**
 * Toggle User Active Status API Route
 * POST /api/users/[id]/toggle-active - Enable/disable user
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { updateUserActiveStatus } from '@/lib/db/queries/users';
import { toggleUserActiveSchema } from '@/lib/validations/user';
import { AppError, API_ERRORS } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/users/[id]/toggle-active
 * Toggle user active status (super_admin only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const { isActive } = toggleUserActiveSchema.parse(body);

    // Update the user active status
    const user = await updateUserActiveStatus(id, isActive);

    if (!user) {
      return handleApiError(new AppError('User not found', 'CB-API-007', 404));
    }

    return successResponse(user, { statusChanged: true });
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
