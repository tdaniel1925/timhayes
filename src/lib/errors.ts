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

// ===== HELPER FUNCTIONS =====

/**
 * Create an AppError from a predefined error
 */
export function createError(
  errorDef: { code: string; message: string; statusCode: number },
  details?: unknown
): AppError {
  return new AppError(errorDef.message, errorDef.code, errorDef.statusCode, details);
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
