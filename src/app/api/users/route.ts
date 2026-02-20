/**
 * Users API Routes
 * GET /api/users - List all users
 * POST /api/users - Create a new user (with Supabase Auth)
 */

import { NextRequest } from 'next/server';
import { verifyAuth, handleApiError, successResponse } from '@/lib/api-utils';
import { getAllUsers, createUser } from '@/lib/db/queries/users';
import { createUserSchema } from '@/lib/validations/user';
import { createServerClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/integrations/resend';
import { AppError, API_ERRORS, AUTH_ERRORS } from '@/lib/errors';
import { randomBytes } from 'crypto';

/**
 * GET /api/users
 * List all users (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    const users = await getAllUsers();

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/users
 * Create a new user with Supabase Auth (super_admin only)
 * Sends welcome email with temporary password if password not provided
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin role
    await verifyAuth(request, ['super_admin']);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const supabase = await createServerClient();

    // Generate temporary password if not provided
    const tempPassword = validatedData.password || generateTempPassword();

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: validatedData.fullName,
        role: validatedData.role,
      },
    });

    if (authError || !authData.user) {
      throw new AppError(
        `Failed to create auth user: ${authError?.message || 'Unknown error'}`,
        AUTH_ERRORS.INVALID_CREDENTIALS.code,
        400,
        authError
      );
    }

    // Create user record in database
    const user = await createUser(authData.user.id, {
      email: validatedData.email,
      fullName: validatedData.fullName,
      role: validatedData.role,
      tenantId: validatedData.tenantId,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fullName, !validatedData.password ? tempPassword : undefined);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Don't return the password in response
    return successResponse(
      {
        ...user,
        tempPasswordSent: !validatedData.password,
      },
      { created: true }
    );
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
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  // Generate a secure random password: 4 words from a simple list + random number
  const words = [
    'apple',
    'banana',
    'cherry',
    'dragon',
    'eagle',
    'forest',
    'galaxy',
    'harbor',
    'island',
    'jungle',
  ];

  const randomWords = Array.from({ length: 4 }, () => words[Math.floor(Math.random() * words.length)]);

  const randomNum = Math.floor(Math.random() * 9000) + 1000;

  return `${randomWords.join('-')}-${randomNum}`;
}
