/**
 * Single PBX Connection API Routes
 * GET /api/connections/[id] - Get connection by ID
 * PATCH /api/connections/[id] - Update connection
 * DELETE /api/connections/[id] - Delete connection
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getConnectionById, updateConnection, deleteConnection } from '@/lib/db/queries/connections';
import { updateConnectionSchema } from '@/lib/validations/connection';
import { AppError, API_ERRORS } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/connections/[id]
 * Get connection by ID (super_admin only)
 * Optionally include decrypted credentials with ?credentials=true query param
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;
    const includeCredentials = request.nextUrl.searchParams.get('credentials') === 'true';

    const connection = await getConnectionById(id, includeCredentials);

    if (!connection) {
      return handleApiError(new AppError('PBX connection not found', API_ERRORS.CONNECTION_NOT_FOUND.code, 404));
    }

    return successResponse(connection);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/connections/[id]
 * Update PBX connection (super_admin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateConnectionSchema.parse(body);

    // Update the connection
    const connection = await updateConnection(id, validatedData);

    if (!connection) {
      return handleApiError(new AppError('PBX connection not found', API_ERRORS.CONNECTION_NOT_FOUND.code, 404));
    }

    return successResponse(connection, { updated: true });
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
 * DELETE /api/connections/[id]
 * Delete PBX connection (super_admin only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Delete the connection
    const connection = await deleteConnection(id);

    if (!connection) {
      return handleApiError(new AppError('PBX connection not found', API_ERRORS.CONNECTION_NOT_FOUND.code, 404));
    }

    return successResponse(connection, { deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
