/**
 * Zod validation schemas for PBX Connection operations
 */

import { z } from 'zod';

// Provider type enum values
export const providerTypeValues = [
  'grandstream_ucm',
  'freepbx',
  '3cx',
  'generic_webhook',
] as const;

// Connection status enum values
export const connectionStatusValues = ['connected', 'disconnected', 'error'] as const;

// Create PBX connection schema
export const createConnectionSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  name: z.string().min(1, 'Connection name is required').max(255, 'Name is too long'),
  providerType: z.enum(providerTypeValues, { message: 'Invalid provider type' }),
  host: z
    .string()
    .min(1, 'Host is required')
    .max(255, 'Host is too long')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Invalid host format'
    ),
  port: z.number().int().min(1, 'Port must be >= 1').max(65535, 'Port must be <= 65535').default(8443),
  apiUsername: z.string().min(1, 'API username is required').max(255, 'Username is too long').optional(),
  apiPassword: z.string().min(1, 'API password is required').max(255, 'Password is too long').optional(),
  configJson: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Update PBX connection schema
export const updateConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required').max(255, 'Name is too long').optional(),
  providerType: z.enum(providerTypeValues).optional(),
  host: z
    .string()
    .min(1, 'Host is required')
    .max(255, 'Host is too long')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Invalid host format'
    )
    .optional(),
  port: z.number().int().min(1).max(65535).optional(),
  apiUsername: z.string().max(255, 'Username is too long').optional().nullable(),
  apiPassword: z.string().max(255, 'Password is too long').optional().nullable(),
  configJson: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().optional(),
});

// Test connection schema
export const testConnectionSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  verifySSL: z.boolean().default(true),
});

// TypeScript types inferred from schemas
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
export type TestConnectionInput = z.infer<typeof testConnectionSchema>;
