/**
 * Test PBX Connection Endpoint
 * POST /api/connections/[id]/test - Test connection to Grandstream UCM
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getConnectionById } from '@/lib/db/queries/connections';
import { testUCMConnection } from '@/lib/integrations/grandstream';
import { testConnectionSchema } from '@/lib/validations/connection';
import { AppError, API_ERRORS } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/connections/[id]/test
 * Test PBX connection (super_admin only)
 * For Grandstream: performs challenge → MD5 hash → login flow
 * Returns success/failure with message
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Get connection with decrypted credentials
    const connection = await getConnectionById(id, true);

    if (!connection) {
      return handleApiError(new AppError('PBX connection not found', API_ERRORS.CONNECTION_NOT_FOUND.code, 404));
    }

    // Parse request body for optional override parameters
    const body = await request.json().catch(() => ({}));

    // Use connection data or override with request body
    const testData = {
      host: body.host || connection.host,
      port: body.port || connection.port,
      username: body.username || (connection as any).apiUsername,
      password: body.password || (connection as any).apiPassword,
      verifySSL: body.verifySSL !== undefined ? body.verifySSL : true,
    };

    // Validate test data
    const validatedData = testConnectionSchema.parse(testData);

    // Only Grandstream UCM supports API testing currently
    if (connection.providerType !== 'grandstream_ucm') {
      return successResponse(
        {
          success: false,
          message: 'Connection testing is currently only supported for Grandstream UCM',
          providerType: connection.providerType,
        },
        { tested: true }
      );
    }

    // Test the connection
    const result = await testUCMConnection(
      validatedData.host,
      validatedData.port,
      validatedData.username,
      validatedData.password,
      validatedData.verifySSL
    );

    return successResponse(result, { tested: true });
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
