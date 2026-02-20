/**
 * Grandstream UCM API Integration
 * Handles authentication and API communication with Grandstream UCM systems
 *
 * CORRECT API FORMAT (from Grandstream Support):
 * All requests go to /api endpoint with action-based JSON body
 *
 * 1. POST /api with {"request": {"action": "challenge", "user": "...", "version": "1.0"}}
 *    → Returns {"response": {"challenge": "..."}, "status": 0}
 *
 * 2. Hash: MD5(challenge + password)
 *
 * 3. POST /api with {"request": {"action": "login", "token": "<hash>", "url": "...", "user": "..."}}
 *    → Returns {"response": {"cookie": "sid..."}, "status": 0}
 *
 * 4. Use cookie for all subsequent requests:
 *    POST /api with {"request": {"action": "recapi", "cookie": "sid...", "recording_file": "..."}}
 */

import { createHash } from 'crypto';
import { AppError, UCM_ERRORS, createError } from '@/lib/errors';

interface UCMApiResponse {
  response: Record<string, any>;
  status: number;
}

/**
 * Authenticate with Grandstream UCM using the correct API format
 * Returns a cookie string for subsequent API requests
 */
export async function authenticateUCM(
  host: string,
  port: number,
  username: string,
  password: string,
  verifySSL: boolean = true
): Promise<string> {
  try {
    const apiUrl = `https://${host}:${port}/api`;

    // Create HTTPS agent
    const httpsAgent = verifySSL
      ? undefined
      : new (await import('https')).Agent({
          rejectUnauthorized: false,
        });

    // Step 1: Get challenge token
    const challengeResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: {
          action: 'challenge',
          user: username,
          version: '1.0',
        },
      }),
      // @ts-ignore - Node.js fetch agent type issues
      ...(httpsAgent ? { agent: httpsAgent } : {}),
    });

    if (!challengeResponse.ok) {
      throw createError(UCM_ERRORS.AUTH_FAILED, {
        status: challengeResponse.status,
        statusText: challengeResponse.statusText,
      });
    }

    const challengeData: UCMApiResponse = await challengeResponse.json();

    if (challengeData.status !== 0) {
      throw createError(UCM_ERRORS.AUTH_FAILED, {
        reason: challengeData.response?.error_msg || 'Challenge request failed',
        ucmStatus: challengeData.status,
      });
    }

    const challenge = challengeData.response?.challenge;
    if (!challenge) {
      throw createError(UCM_ERRORS.AUTH_FAILED, { reason: 'No challenge token received' });
    }

    // Step 2: Hash the password with challenge (MD5)
    const token = createHash('md5')
      .update(challenge + password)
      .digest('hex');

    // Step 3: Login with hashed token
    const loginResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: {
          action: 'login',
          token: token,
          url: apiUrl,
          user: username,
        },
      }),
      // @ts-ignore
      ...(httpsAgent ? { agent: httpsAgent } : {}),
    });

    if (!loginResponse.ok) {
      throw createError(UCM_ERRORS.AUTH_FAILED, {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
      });
    }

    const loginData: UCMApiResponse = await loginResponse.json();

    if (loginData.status !== 0) {
      throw createError(UCM_ERRORS.AUTH_FAILED, {
        reason: loginData.response?.error_msg || 'Login failed',
        ucmStatus: loginData.status,
        remainAttempts: loginData.response?.remain_num,
      });
    }

    const cookie = loginData.response?.cookie;
    if (!cookie) {
      throw createError(UCM_ERRORS.AUTH_FAILED, { reason: 'No session cookie received' });
    }

    return cookie;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Check if it's a network error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      throw createError(UCM_ERRORS.UNREACHABLE, error);
    }

    throw createError(UCM_ERRORS.AUTH_FAILED, error);
  }
}

/**
 * Test UCM connection (for connection test endpoint)
 * Returns success/failure without throwing
 */
export async function testUCMConnection(
  host: string,
  port: number,
  username: string,
  password: string,
  verifySSL: boolean = true
): Promise<{ success: boolean; message: string; cookie?: string }> {
  try {
    const cookie = await authenticateUCM(host, port, username, password, verifySSL);

    return {
      success: true,
      message: 'Successfully connected to Grandstream UCM',
      cookie,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Download recording from Grandstream UCM using RECAPI
 * Uses the cookie-based authentication with action-based API
 */
export async function downloadRecording(
  cookie: string,
  host: string,
  port: number,
  filename: string,
  verifySSL: boolean = true
): Promise<Buffer> {
  try {
    const apiUrl = `https://${host}:${port}/api`;

    // Create HTTPS agent
    const httpsAgent = verifySSL
      ? undefined
      : new (await import('https')).Agent({
          rejectUnauthorized: false,
        });

    // Use RECAPI action with cookie
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: {
          action: 'recapi',
          cookie: cookie,
          recording_file: filename,
        },
      }),
      // @ts-ignore
      ...(httpsAgent ? { agent: httpsAgent } : {}),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw createError(UCM_ERRORS.RECORDING_NOT_FOUND, { filename });
      }

      if (response.status === 401) {
        throw createError(UCM_ERRORS.SESSION_EXPIRED);
      }

      throw new AppError(
        `Failed to download recording: ${response.statusText}`,
        UCM_ERRORS.AUTH_FAILED.code,
        response.status
      );
    }

    // Check if response is JSON (error) or binary (recording)
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // This is an error response
      const errorData: UCMApiResponse = await response.json();

      if (errorData.status !== 0) {
        throw createError(UCM_ERRORS.RECORDING_NOT_FOUND, {
          filename,
          reason: errorData.response?.error_msg || 'Recording download failed',
        });
      }
    }

    // Convert response to buffer (recording file)
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw createError(UCM_ERRORS.AUTH_FAILED, error);
  }
}
