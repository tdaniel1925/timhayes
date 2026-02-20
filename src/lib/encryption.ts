/**
 * Encryption utilities for securing PBX credentials
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppError } from './errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM mode
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variable
 * The key should be a 32-byte hex string
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new AppError('ENCRYPTION_KEY environment variable is not set', 'CB-ENCRYPT-001', 500);
  }

  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new AppError(
      `ENCRYPTION_KEY must be a ${KEY_LENGTH}-byte hex string (${KEY_LENGTH * 2} characters)`,
      'CB-ENCRYPT-002',
      500
    );
  }

  try {
    return Buffer.from(keyHex, 'hex');
  } catch (error) {
    throw new AppError('ENCRYPTION_KEY is not a valid hex string', 'CB-ENCRYPT-003', 500);
  }
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns a base64-encoded string containing IV + auth tag + ciphertext
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + ciphertext and encode as base64
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(ciphertext, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to encrypt data',
      'CB-ENCRYPT-004',
      500,
      error as Error
    );
  }
}

/**
 * Decrypt a string that was encrypted with the encrypt() function
 *
 * @param encryptedData - Base64-encoded encrypted data
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV, auth tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to decrypt data. Data may be corrupted or key may have changed.',
      'CB-ENCRYPT-005',
      500,
      error as Error
    );
  }
}

/**
 * Generate a random hex string for webhook secrets
 *
 * @param byteLength - Number of random bytes to generate (default: 32)
 * @returns Hex-encoded random string
 */
export function generateSecret(byteLength: number = 32): string {
  return randomBytes(byteLength).toString('hex');
}
