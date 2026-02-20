/**
 * Tenants API Routes
 * GET /api/tenants - List all tenants
 * POST /api/tenants - Create a new tenant
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getAllTenants, createTenant } from '@/lib/db/queries/tenants';
import { createTenantSchema } from '@/lib/validations/tenant';
import { AppError, API_ERRORS } from '@/lib/errors';

/**
 * GET /api/tenants
 * List all tenants (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const tenants = await getAllTenants();

    return successResponse(tenants);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tenants
 * Create a new tenant (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTenantSchema.parse(body);

    // Create the tenant
    const tenant = await createTenant(validatedData);

    return successResponse(tenant, { created: true });
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
