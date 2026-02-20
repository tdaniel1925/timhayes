/**
 * Single Tenant API Routes
 * GET /api/tenants/[id] - Get tenant by ID
 * PATCH /api/tenants/[id] - Update tenant
 * DELETE /api/tenants/[id] - Delete (cancel) tenant
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getTenantById, updateTenant, deleteTenant } from '@/lib/db/queries/tenants';
import { updateTenantSchema } from '@/lib/validations/tenant';
import { AppError, API_ERRORS } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/tenants/[id]
 * Get tenant by ID (super_admin only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;
    const tenant = await getTenantById(id);

    if (!tenant) {
      return handleApiError(new AppError('Tenant not found', 'CB-API-006', 404));
    }

    return successResponse(tenant);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tenants/[id]
 * Update tenant (super_admin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    // Update the tenant
    const tenant = await updateTenant(id, validatedData);

    if (!tenant) {
      return handleApiError(new AppError('Tenant not found', 'CB-API-006', 404));
    }

    return successResponse(tenant, { updated: true });
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
 * DELETE /api/tenants/[id]
 * Soft delete tenant by setting status to 'cancelled' (super_admin only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Delete the tenant
    const tenant = await deleteTenant(id);

    if (!tenant) {
      return handleApiError(new AppError('Tenant not found', 'CB-API-006', 404));
    }

    return successResponse(tenant, { deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
