/**
 * CodeBakers Error Code System for AudiaPro
 *
 * Format: CB-{CATEGORY}-{NUMBER}
 * Categories: AUTH, DB, API, INT (Integration), UI, CRON, EMAIL, SMS
 *
 * All errors should be logged to Sentry with the error code for tracking
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Alias for backwards compatibility
export const CodeBakersError = AppError;

// ===== AUTH ERRORS =====
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'CB-AUTH-001',
    message: 'Invalid credentials',
    statusCode: 401,
  },
  SESSION_EXPIRED: {
    code: 'CB-AUTH-002',
    message: 'Session expired',
    statusCode: 401,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'CB-AUTH-003',
    message: 'Insufficient permissions',
    statusCode: 403,
  },
  ACCOUNT_SUSPENDED: {
    code: 'CB-AUTH-004',
    message: 'Account suspended',
    statusCode: 403,
  },
} as const;

// ===== DATABASE ERRORS =====
export const DB_ERRORS = {
  CONNECTION_FAILED: {
    code: 'CB-DB-001',
    message: 'Database connection failed',
    statusCode: 500,
  },
  QUERY_TIMEOUT: {
    code: 'CB-DB-002',
    message: 'Database query timeout',
    statusCode: 500,
  },
  RLS_VIOLATION: {
    code: 'CB-DB-003',
    message: 'Row-level security violation',
    statusCode: 403,
  },
  UNIQUE_CONSTRAINT_VIOLATION: {
    code: 'CB-DB-004',
    message: 'Unique constraint violation',
    statusCode: 409,
  },
} as const;

// ===== API ERRORS =====
export const API_ERRORS = {
  INVALID_WEBHOOK_SECRET: {
    code: 'CB-API-001',
    message: 'Invalid webhook secret',
    statusCode: 401,
  },
  CONNECTION_NOT_FOUND: {
    code: 'CB-API-002',
    message: 'PBX connection not found',
    statusCode: 404,
  },
  TENANT_SUSPENDED: {
    code: 'CB-API-003',
    message: 'Tenant account suspended',
    statusCode: 403,
  },
  PAYLOAD_VALIDATION_FAILED: {
    code: 'CB-API-004',
    message: 'Payload validation failed',
    statusCode: 400,
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'CB-API-005',
    message: 'Rate limit exceeded',
    statusCode: 429,
  },
} as const;

// ===== INTEGRATION ERRORS =====

// Grandstream UCM
export const UCM_ERRORS = {
  AUTH_FAILED: {
    code: 'CB-INT-001',
    message: 'Grandstream UCM authentication failed',
    statusCode: 500,
  },
  RECORDING_NOT_FOUND: {
    code: 'CB-INT-002',
    message: 'Recording not found on UCM server',
    statusCode: 404,
  },
  SESSION_EXPIRED: {
    code: 'CB-INT-003',
    message: 'UCM session expired',
    statusCode: 401,
  },
  UNREACHABLE: {
    code: 'CB-INT-004',
    message: 'UCM server unreachable',
    statusCode: 503,
  },
} as const;

// Deepgram
export const DEEPGRAM_ERRORS = {
  AUTH_FAILED: {
    code: 'CB-INT-010',
    message: 'Deepgram API authentication failed',
    statusCode: 500,
  },
  TRANSCRIPTION_FAILED: {
    code: 'CB-INT-011',
    message: 'Transcription failed',
    statusCode: 500,
  },
  UNSUPPORTED_FORMAT: {
    code: 'CB-INT-012',
    message: 'Unsupported audio format',
    statusCode: 400,
  },
} as const;

// Anthropic Claude
export const CLAUDE_ERRORS = {
  AUTH_FAILED: {
    code: 'CB-INT-020',
    message: 'Claude API authentication failed',
    statusCode: 500,
  },
  ANALYSIS_FAILED: {
    code: 'CB-INT-021',
    message: 'AI analysis failed',
    statusCode: 500,
  },
  RESPONSE_PARSE_ERROR: {
    code: 'CB-INT-022',
    message: 'Failed to parse AI response',
    statusCode: 500,
  },
} as const;

// ===== UI ERRORS =====
export const UI_ERRORS = {
  COMPONENT_RENDER_ERROR: {
    code: 'CB-UI-001',
    message: 'Component render error',
    statusCode: 500,
  },
  FORM_VALIDATION_ERROR: {
    code: 'CB-UI-002',
    message: 'Form validation error',
    statusCode: 400,
  },
} as const;

// ===== CRON ERRORS =====
export const CRON_ERRORS = {
  EMAIL_REPORT_FAILED: {
    code: 'CB-CRON-001',
    message: 'Email report generation failed',
    statusCode: 500,
  },
  BILLING_CALCULATION_FAILED: {
    code: 'CB-CRON-002',
    message: 'Billing calculation failed',
    statusCode: 500,
  },
} as const;

// ===== EMAIL ERRORS =====
export const EMAIL_ERRORS = {
  SEND_FAILED: {
    code: 'CB-EMAIL-001',
    message: 'Email send failed',
    statusCode: 500,
  },
  TEMPLATE_ERROR: {
    code: 'CB-EMAIL-002',
    message: 'Email template error',
    statusCode: 500,
  },
  INVALID_RECIPIENT: {
    code: 'CB-EMAIL-003',
    message: 'Invalid recipient email address',
    statusCode: 400,
  },
} as const;

// ===== ENCRYPTION ERRORS =====
export const ENCRYPTION_ERRORS = {
  KEY_NOT_SET: {
    code: 'CB-ENCRYPT-001',
    message: 'Encryption key not configured',
    statusCode: 500,
  },
  INVALID_KEY_LENGTH: {
    code: 'CB-ENCRYPT-002',
    message: 'Invalid encryption key length',
    statusCode: 500,
  },
  INVALID_KEY_FORMAT: {
    code: 'CB-ENCRYPT-003',
    message: 'Invalid encryption key format',
    statusCode: 500,
  },
  ENCRYPTION_FAILED: {
    code: 'CB-ENCRYPT-004',
    message: 'Encryption failed',
    statusCode: 500,
  },
  DECRYPTION_FAILED: {
    code: 'CB-ENCRYPT-005',
    message: 'Decryption failed',
    statusCode: 500,
  },
} as const;

// ===== SMS ERRORS (Reserved for future use) =====
export const SMS_ERRORS = {
  SEND_FAILED: {
    code: 'CB-SMS-001',
    message: 'SMS send failed (reserved for future use)',
    statusCode: 500,
  },
} as const;

// ===== GENERAL ERRORS =====
export const GENERAL_ERRORS = {
  INTERNAL_ERROR: {
    code: 'CB-GEN-001',
    message: 'Internal server error',
    statusCode: 500,
  },
  NOT_FOUND: {
    code: 'CB-GEN-002',
    message: 'Resource not found',
    statusCode: 404,
  },
  BAD_REQUEST: {
    code: 'CB-GEN-003',
    message: 'Bad request',
    statusCode: 400,
  },
} as const;

// ===== CONSOLIDATED ERROR CODE NAMESPACE =====
// This provides a single namespace for all error codes used throughout the app
export const ErrorCode = {
  // General
  GENERAL_INTERNAL_ERROR: GENERAL_ERRORS.INTERNAL_ERROR,
  GENERAL_NOT_FOUND: GENERAL_ERRORS.NOT_FOUND,
  GENERAL_BAD_REQUEST: GENERAL_ERRORS.BAD_REQUEST,

  // Auth
  AUTH_INVALID_CREDENTIALS: AUTH_ERRORS.INVALID_CREDENTIALS,
  AUTH_SESSION_EXPIRED: AUTH_ERRORS.SESSION_EXPIRED,
  AUTH_INSUFFICIENT_PERMISSIONS: AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
  AUTH_ACCOUNT_SUSPENDED: AUTH_ERRORS.ACCOUNT_SUSPENDED,

  // Database
  DB_CONNECTION_FAILED: DB_ERRORS.CONNECTION_FAILED,
  DB_QUERY_TIMEOUT: DB_ERRORS.QUERY_TIMEOUT,
  DB_RLS_VIOLATION: DB_ERRORS.RLS_VIOLATION,
  DB_UNIQUE_CONSTRAINT_VIOLATION: DB_ERRORS.UNIQUE_CONSTRAINT_VIOLATION,

  // API
  API_INVALID_WEBHOOK_SECRET: API_ERRORS.INVALID_WEBHOOK_SECRET,
  API_CONNECTION_NOT_FOUND: API_ERRORS.CONNECTION_NOT_FOUND,
  API_TENANT_SUSPENDED: API_ERRORS.TENANT_SUSPENDED,
  API_PAYLOAD_VALIDATION_FAILED: API_ERRORS.PAYLOAD_VALIDATION_FAILED,
  API_RATE_LIMIT_EXCEEDED: API_ERRORS.RATE_LIMIT_EXCEEDED,

  // UCM Integration
  UCM_AUTH_FAILED: UCM_ERRORS.AUTH_FAILED,
  UCM_RECORDING_NOT_FOUND: UCM_ERRORS.RECORDING_NOT_FOUND,
  UCM_SESSION_EXPIRED: UCM_ERRORS.SESSION_EXPIRED,
  UCM_UNREACHABLE: UCM_ERRORS.UNREACHABLE,

  // Deepgram
  DEEPGRAM_AUTH_FAILED: DEEPGRAM_ERRORS.AUTH_FAILED,
  DEEPGRAM_TRANSCRIPTION_FAILED: DEEPGRAM_ERRORS.TRANSCRIPTION_FAILED,
  DEEPGRAM_UNSUPPORTED_FORMAT: DEEPGRAM_ERRORS.UNSUPPORTED_FORMAT,

  // Claude
  CLAUDE_AUTH_FAILED: CLAUDE_ERRORS.AUTH_FAILED,
  CLAUDE_ANALYSIS_FAILED: CLAUDE_ERRORS.ANALYSIS_FAILED,
  CLAUDE_RESPONSE_PARSE_ERROR: CLAUDE_ERRORS.RESPONSE_PARSE_ERROR,

  // UI
  UI_COMPONENT_RENDER_ERROR: UI_ERRORS.COMPONENT_RENDER_ERROR,
  UI_FORM_VALIDATION_ERROR: UI_ERRORS.FORM_VALIDATION_ERROR,

  // Cron
  CRON_EMAIL_REPORT_FAILED: CRON_ERRORS.EMAIL_REPORT_FAILED,
  CRON_BILLING_CALCULATION_FAILED: CRON_ERRORS.BILLING_CALCULATION_FAILED,

  // Email
  EMAIL_SEND_FAILED: EMAIL_ERRORS.SEND_FAILED,
  EMAIL_TEMPLATE_ERROR: EMAIL_ERRORS.TEMPLATE_ERROR,
  EMAIL_INVALID_RECIPIENT: EMAIL_ERRORS.INVALID_RECIPIENT,

  // Encryption
  ENCRYPTION_KEY_NOT_SET: ENCRYPTION_ERRORS.KEY_NOT_SET,
  ENCRYPTION_INVALID_KEY_LENGTH: ENCRYPTION_ERRORS.INVALID_KEY_LENGTH,
  ENCRYPTION_INVALID_KEY_FORMAT: ENCRYPTION_ERRORS.INVALID_KEY_FORMAT,
  ENCRYPTION_FAILED: ENCRYPTION_ERRORS.ENCRYPTION_FAILED,
  DECRYPTION_FAILED: ENCRYPTION_ERRORS.DECRYPTION_FAILED,

  // SMS
  SMS_SEND_FAILED: SMS_ERRORS.SEND_FAILED,
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Create an AppError from a predefined error
 *
 * @param errorDef - The error definition with code, message, and statusCode
 * @param customMessageOrDetails - Optional custom message (string) or details (object)
 * @param details - Optional details (only if second param is a string)
 */
export function createError(
  errorDef: { code: string; message: string; statusCode: number },
  customMessageOrDetails?: string | unknown,
  details?: unknown
): AppError {
  // If second param is a string, use it as custom message
  if (typeof customMessageOrDetails === 'string') {
    return new AppError(customMessageOrDetails, errorDef.code, errorDef.statusCode, details);
  }

  // Otherwise, second param is details
  return new AppError(errorDef.message, errorDef.code, errorDef.statusCode, customMessageOrDetails);
}

/**
 * Log error to Sentry (if initialized) and console
 */
export function logError(error: AppError | Error, context?: Record<string, unknown>) {
  console.error('[AudiaPro Error]', {
    code: error instanceof AppError ? error.code : 'UNKNOWN',
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // TODO: Log to Sentry when initialized
  // Sentry.captureException(error, { extra: context });
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  return {
    error: {
      code: 'CB-UNKNOWN-ERROR',
      message: error.message || 'An unknown error occurred',
    },
  };
}
