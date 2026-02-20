/**
 * Toggle Tenant Status API Route
 * POST /api/tenants/[id]/toggle-status - Update tenant status
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { updateTenantStatus, getTenantById } from '@/lib/db/queries/tenants';
import { getUsersByTenantId } from '@/lib/db/queries/users';
import { toggleTenantStatusSchema } from '@/lib/validations/tenant';
import { AppError, API_ERRORS } from '@/lib/errors';
import { sendTenantStatusEmail } from '@/lib/integrations/resend';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/tenants/[id]/toggle-status
 * Toggle tenant status between active, suspended, cancelled (super_admin only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const { status } = toggleTenantStatusSchema.parse(body);

    // Get tenant to check current status
    const currentTenant = await getTenantById(id);
    if (!currentTenant) {
      return handleApiError(new AppError('Tenant not found', 'CB-API-006', 404));
    }

    // Update the tenant status
    const tenant = await updateTenantStatus(id, status);

    if (!tenant) {
      return handleApiError(new AppError('Failed to update tenant status', 'CB-DB-001', 500));
    }

    // Send email notification if status changed to suspended or reactivated
    if (status === 'suspended' && currentTenant.status === 'active') {
      // Get all client_admin users for this tenant
      const tenantUsers = await getUsersByTenantId(id);
      const clientAdmins = tenantUsers.filter((u) => u.role === 'client_admin');

      // Send suspension emails
      for (const user of clientAdmins) {
        try {
          await sendTenantStatusEmail(user.email, user.fullName, tenant.name, 'suspended');
        } catch (emailError) {
          console.error('Failed to send suspension email:', emailError);
          // Don't fail the request if email fails
        }
      }

      // Also send to billing email if set
      if (tenant.billingEmail) {
        try {
          await sendTenantStatusEmail(tenant.billingEmail, '', tenant.name, 'suspended');
        } catch (emailError) {
          console.error('Failed to send suspension email to billing:', emailError);
        }
      }
    } else if (status === 'active' && currentTenant.status === 'suspended') {
      // Send reactivation emails
      const tenantUsers = await getUsersByTenantId(id);
      const clientAdmins = tenantUsers.filter((u) => u.role === 'client_admin');

      for (const user of clientAdmins) {
        try {
          await sendTenantStatusEmail(user.email, user.fullName, tenant.name, 'reactivated');
        } catch (emailError) {
          console.error('Failed to send reactivation email:', emailError);
        }
      }

      if (tenant.billingEmail) {
        try {
          await sendTenantStatusEmail(tenant.billingEmail, '', tenant.name, 'reactivated');
        } catch (emailError) {
          console.error('Failed to send reactivation email to billing:', emailError);
        }
      }
    }

    return successResponse(tenant, { statusChanged: true });
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
