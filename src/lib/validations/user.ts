/**
 * Zod validation schemas for User operations
 */

import { z } from 'zod';

// User role enum values
export const userRoleValues = ['super_admin', 'client_admin'] as const;

// Create user schema
export const createUserSchema = z
  .object({
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    fullName: z.string().min(1, 'Full name is required').max(255, 'Name is too long'),
    role: z.enum(userRoleValues, {
      message: 'Invalid role',
    }),
    tenantId: z.string().uuid('Invalid tenant ID').optional().nullable(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(255, 'Password is too long')
      .optional(), // Optional because we can send invite email instead
  })
  .superRefine((data, ctx) => {
    // If role is client_admin, tenantId is required
    if (data.role === 'client_admin' && !data.tenantId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tenantId'],
        message: 'Tenant ID is required for client_admin role',
      });
    }
  });

// Update user schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long').optional(),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Name is too long').optional(),
  role: z.enum(userRoleValues).optional(),
  tenantId: z.string().uuid('Invalid tenant ID').optional().nullable(),
  isActive: z.boolean().optional(),
});

// Toggle active status schema
export const toggleUserActiveSchema = z.object({
  isActive: z.boolean(),
});

// TypeScript types inferred from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
