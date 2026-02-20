/**
 * Zod validation schemas for Tenant operations
 */

import { z } from 'zod';

// Tenant status enum values
export const tenantStatusValues = ['active', 'suspended', 'cancelled'] as const;

// Create tenant schema
export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(255, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens only'
    ),
  billingEmail: z.string().email('Invalid email address').optional().nullable(),
  billingPlan: z.string().default('standard'),
  monthlyRateCents: z.number().int().min(0, 'Rate must be positive').default(34900),
  perCallRateCents: z.number().int().min(0, 'Rate must be positive').default(10),
  notes: z.string().max(2000, 'Notes are too long').optional().nullable(),
});

// Update tenant schema (all fields optional except those that shouldn't change)
export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(255, 'Name is too long').optional(),
  billingEmail: z.string().email('Invalid email address').optional().nullable(),
  billingPlan: z.string().optional(),
  monthlyRateCents: z.number().int().min(0, 'Rate must be positive').optional(),
  perCallRateCents: z.number().int().min(0, 'Rate must be positive').optional(),
  notes: z.string().max(2000, 'Notes are too long').optional().nullable(),
});

// Toggle status schema
export const toggleTenantStatusSchema = z.object({
  status: z.enum(tenantStatusValues),
});

// TypeScript types inferred from schemas
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type ToggleTenantStatusInput = z.infer<typeof toggleTenantStatusSchema>;
