/**
 * Grandstream UCM API Integration for Worker
 * Standalone version with simpler error handling
 */

import { createHash } from 'crypto';
import https from 'https';

interface UCMApiResponse {
  response: Record<string, any>;
  status: number;
}

/**
 * Authenticate with Grandstream UCM
 * Returns cookie for subsequent API requests
 */
export async function authenticateUCM(
  host: string,
  port: number,
  username: string,
  password: string,
  verifySSL: boolean = false
): Promise<string> {
  const apiUrl = `https://${host}:${port}/api`;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: verifySSL,
  });

  // Step 1: Get challenge
  const challengeResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: {
        action: 'challenge',
        user: username,
        version: '1.0',
      },
    }),
    // @ts-ignore
    agent: httpsAgent,
  });

  if (!challengeResponse.ok) {
    throw new Error(`UCM challenge failed: ${challengeResponse.statusText}`);
  }

  const challengeData: UCMApiResponse = await challengeResponse.json();

  if (challengeData.status !== 0) {
    throw new Error(
      `UCM challenge failed: ${challengeData.response?.error_msg || 'Unknown error'}`
    );
  }

  const challenge = challengeData.response?.challenge;
  if (!challenge) {
    throw new Error('No challenge token received from UCM');
  }

  // Step 2: Hash password
  const token = createHash('md5')
    .update(challenge + password)
    .digest('hex');

  // Step 3: Login
  const loginResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: {
        action: 'login',
        token: token,
        url: apiUrl,
        user: username,
      },
    }),
    // @ts-ignore
    agent: httpsAgent,
  });

  if (!loginResponse.ok) {
    throw new Error(`UCM login failed: ${loginResponse.statusText}`);
  }

  const loginData: UCMApiResponse = await loginResponse.json();

  if (loginData.status !== 0) {
    throw new Error(
      `UCM login failed: ${loginData.response?.error_msg || 'Unknown error'}`
    );
  }

  const cookie = loginData.response?.cookie;
  if (!cookie) {
    throw new Error('No session cookie received from UCM');
  }

  return cookie;
}

/**
 * Download recording from UCM using RECAPI
 */
export async function downloadRecording(
  cookie: string,
  host: string,
  port: number,
  filename: string,
  verifySSL: boolean = false
): Promise<Buffer> {
  const apiUrl = `https://${host}:${port}/api`;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: verifySSL,
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: {
        action: 'recapi',
        cookie: cookie,
        recording_file: filename,
      },
    }),
    // @ts-ignore
    agent: httpsAgent,
  });

  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.statusText}`);
  }

  // Check if response is JSON error or binary file
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    const errorData: UCMApiResponse = await response.json();
    if (errorData.status !== 0) {
      throw new Error(
        `Recording download failed: ${errorData.response?.error_msg || 'Unknown error'}`
      );
    }
  }

  // Return binary recording file
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
