/**
 * Resend email integration
 * Handles all transactional and marketing emails for AudiaPro
 */

import { Resend } from 'resend';
import { AppError, EMAIL_ERRORS } from '@/lib/errors';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@audiapro.com';
const APP_NAME = 'AudiaPro';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://audiapro.com';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, fullName: string, tempPassword?: string) {
  if (!resend) {
    console.warn('Resend not configured, skipping welcome email');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html: getWelcomeEmailTemplate(fullName, tempPassword),
    });

    if (error) {
      throw new AppError(
        'Failed to send welcome email',
        EMAIL_ERRORS.SEND_FAILED.code,
        500,
        error
      );
    }

    return data;
  } catch (error) {
    console.error('Welcome email error:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to send welcome email', EMAIL_ERRORS.SEND_FAILED.code, 500, error);
  }
}

/**
 * Send tenant status change email (suspended or reactivated)
 */
export async function sendTenantStatusEmail(
  email: string,
  fullName: string,
  tenantName: string,
  status: 'suspended' | 'reactivated'
) {
  if (!resend) {
    console.warn('Resend not configured, skipping status email');
    return;
  }

  try {
    const subject =
      status === 'suspended'
        ? `${APP_NAME} Account Suspended - Action Required`
        : `${APP_NAME} Account Reactivated`;

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html:
        status === 'suspended'
          ? getSuspendedEmailTemplate(fullName, tenantName)
          : getReactivatedEmailTemplate(fullName, tenantName),
    });

    if (error) {
      throw new AppError(
        'Failed to send status email',
        EMAIL_ERRORS.SEND_FAILED.code,
        500,
        error
      );
    }

    return data;
  } catch (error) {
    console.error('Status email error:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to send status email', EMAIL_ERRORS.SEND_FAILED.code, 500, error);
  }
}

/**
 * Send password reset email (Supabase handles this, but we can customize)
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  if (!resend) {
    console.warn('Resend not configured, skipping password reset email');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Reset Your ${APP_NAME} Password`,
      html: getPasswordResetEmailTemplate(resetLink),
    });

    if (error) {
      throw new AppError(
        'Failed to send password reset email',
        EMAIL_ERRORS.SEND_FAILED.code,
        500,
        error
      );
    }

    return data;
  } catch (error) {
    console.error('Password reset email error:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to send password reset email', EMAIL_ERRORS.SEND_FAILED.code, 500, error);
  }
}

// ===== EMAIL TEMPLATES =====

function getWelcomeEmailTemplate(fullName: string, tempPassword?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${APP_NAME}</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #F5F5F7; background-color: #0F1117; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #1A1D27; border-radius: 12px; overflow: hidden; border: 1px solid #2E3142;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF7F50 0%, #E86840 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Call Analytics</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #F5F5F7; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${fullName}!</h2>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              Your ${APP_NAME} account has been created successfully. You now have access to AI-powered call recording and analytics.
            </p>

            ${
              tempPassword
                ? `
              <div style="background-color: #242736; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #FF7F50;">
                <p style="color: #F5F5F7; margin: 0 0 10px 0; font-weight: 600;">Temporary Password:</p>
                <code style="color: #FF7F50; font-size: 18px; font-family: 'Courier New', monospace;">${tempPassword}</code>
                <p style="color: #9CA3AF; margin: 15px 0 0 0; font-size: 14px;">
                  <strong>Important:</strong> Please change your password after your first login.
                </p>
              </div>
            `
                : ''
            }

            <div style="margin: 30px 0;">
              <a href="${APP_URL}/login" style="display: inline-block; background-color: #FF7F50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Log In to ${APP_NAME}
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #2E3142;">
              <h3 style="color: #F5F5F7; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
              <ul style="color: #9CA3AF; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Explore your dashboard and analytics</li>
                <li style="margin-bottom: 10px;">View call recordings and AI-generated transcripts</li>
                <li style="margin-bottom: 10px;">Analyze sentiment and keywords from your calls</li>
                <li style="margin-bottom: 10px;">Generate reports and insights</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #0F1117; padding: 30px; text-align: center; border-top: 1px solid #2E3142;">
            <p style="color: #9CA3AF; margin: 0; font-size: 14px;">
              Need help? Contact us at <a href="mailto:support@audiapro.com" style="color: #FF7F50; text-decoration: none;">support@audiapro.com</a>
            </p>
            <p style="color: #6B7280; margin: 15px 0 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} BotMakers Inc. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getSuspendedEmailTemplate(fullName: string, tenantName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #F5F5F7; background-color: #0F1117; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #1A1D27; border-radius: 12px; overflow: hidden; border: 1px solid #2E3142;">
          <div style="background-color: #EF4444; padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Account Suspended</h1>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              ${fullName ? `Hello ${fullName},` : 'Hello,'}
            </p>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              Your ${APP_NAME} account for <strong style="color: #F5F5F7;">${tenantName}</strong> has been suspended.
            </p>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              This means:
            </p>

            <ul style="color: #9CA3AF; margin: 0 0 20px 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">You cannot access the dashboard or view call data</li>
              <li style="margin-bottom: 10px;">No new calls will be processed</li>
              <li style="margin-bottom: 10px;">Existing data is preserved and will be accessible when reactivated</li>
            </ul>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              To reactivate your account, please contact our billing department or resolve any outstanding payment issues.
            </p>

            <div style="margin: 30px 0;">
              <a href="mailto:billing@audiapro.com" style="display: inline-block; background-color: #FF7F50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Contact Billing
              </a>
            </div>
          </div>

          <div style="background-color: #0F1117; padding: 30px; text-align: center; border-top: 1px solid #2E3142;">
            <p style="color: #9CA3AF; margin: 0; font-size: 14px;">
              Questions? Contact <a href="mailto:support@audiapro.com" style="color: #FF7F50; text-decoration: none;">support@audiapro.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getReactivatedEmailTemplate(fullName: string, tenantName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reactivated</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #F5F5F7; background-color: #0F1117; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #1A1D27; border-radius: 12px; overflow: hidden; border: 1px solid #2E3142;">
          <div style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Welcome Back!</h1>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              ${fullName ? `Hello ${fullName},` : 'Hello,'}
            </p>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              Great news! Your ${APP_NAME} account for <strong style="color: #F5F5F7;">${tenantName}</strong> has been reactivated.
            </p>

            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              You can now:
            </p>

            <ul style="color: #9CA3AF; margin: 0 0 20px 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Access your dashboard and all historical data</li>
              <li style="margin-bottom: 10px;">Resume call processing and AI analysis</li>
              <li style="margin-bottom: 10px;">View recordings, transcripts, and analytics</li>
            </ul>

            <div style="margin: 30px 0;">
              <a href="${APP_URL}/login" style="display: inline-block; background-color: #FF7F50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Log In to ${APP_NAME}
              </a>
            </div>
          </div>

          <div style="background-color: #0F1117; padding: 30px; text-align: center; border-top: 1px solid #2E3142;">
            <p style="color: #9CA3AF; margin: 0; font-size: 14px;">
              Need help? Contact <a href="mailto:support@audiapro.com" style="color: #FF7F50; text-decoration: none;">support@audiapro.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getPasswordResetEmailTemplate(resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #F5F5F7; background-color: #0F1117; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #1A1D27; border-radius: 12px; overflow: hidden; border: 1px solid #2E3142;">
          <div style="background: linear-gradient(135deg, #FF7F50 0%, #E86840 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Reset Your Password</h1>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #9CA3AF; font-size: 16px; margin: 0 0 20px 0;">
              We received a request to reset your ${APP_NAME} password. Click the button below to create a new password:
            </p>

            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #FF7F50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="color: #9CA3AF; font-size: 14px; margin: 30px 0 0 0;">
              This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="background-color: #0F1117; padding: 30px; text-align: center; border-top: 1px solid #2E3142;">
            <p style="color: #9CA3AF; margin: 0; font-size: 14px;">
              Need help? Contact <a href="mailto:support@audiapro.com" style="color: #FF7F50; text-decoration: none;">support@audiapro.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
