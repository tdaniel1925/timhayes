/**
 * PBX Connections API Routes
 * GET /api/connections - List all connections
 * POST /api/connections - Create a new connection
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getAllConnections, createConnection } from '@/lib/db/queries/connections';
import { createConnectionSchema } from '@/lib/validations/connection';
import { AppError, API_ERRORS } from '@/lib/errors';

/**
 * GET /api/connections
 * List all PBX connections (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const connections = await getAllConnections();

    return successResponse(connections);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/connections
 * Create a new PBX connection (super_admin only)
 * Auto-generates webhook URL and secret, encrypts credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createConnectionSchema.parse(body);

    // Create the connection
    const connection = await createConnection(validatedData);

    return successResponse(connection, { created: true });
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
