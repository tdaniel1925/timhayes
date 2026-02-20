/**
 * Download Step: Download recording from PBX and upload to Supabase Storage
 */

import { authenticateUCM, downloadRecording } from '../lib/grandstream.js';
import { supabase, uploadToStorage } from '../lib/supabase.js';
import { createDecipheriv } from 'crypto';

interface DownloadStepInput {
  cdrRecordId: string;
  tenantId: string;
}

interface DownloadStepResult {
  recordingPath: string;
  recordingSizeBytes: number;
}

/**
 * Decrypt AES-256-GCM encrypted credentials
 */
function decryptCredentials(encrypted: string, encryptionKey: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const [ivHex, authTagHex, encryptedDataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedData = Buffer.from(encryptedDataHex, 'hex');
  const key = Buffer.from(encryptionKey, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Download recording from PBX and upload to storage
 */
export async function downloadStep(
  input: DownloadStepInput
): Promise<DownloadStepResult> {
  const { cdrRecordId, tenantId } = input;

  console.log(`[Download] Starting for CDR ${cdrRecordId}`);

  // 1. Get CDR record with connection details
  const { data: cdr, error: cdrError } = await supabase
    .from('cdr_records')
    .select(
      `
      *,
      pbx_connection:pbx_connections (
        id,
        name,
        host,
        port,
        username,
        password_encrypted,
        verify_ssl
      )
    `
    )
    .eq('id', cdrRecordId)
    .single();

  if (cdrError || !cdr) {
    throw new Error(`CDR record not found: ${cdrError?.message || 'Unknown'}`);
  }

  if (!cdr.recording_filename) {
    throw new Error('No recording filename in CDR record');
  }

  const connection = cdr.pbx_connection;
  if (!connection) {
    throw new Error('PBX connection not found for CDR');
  }

  // 2. Decrypt PBX password
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not set in environment');
  }

  let password: string;
  try {
    password = decryptCredentials(connection.password_encrypted, encryptionKey);
  } catch (error) {
    throw new Error(
      `Failed to decrypt PBX password: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  // 3. Authenticate with Grandstream UCM
  console.log(
    `[Download] Authenticating with UCM at ${connection.host}:${connection.port}`
  );

  let cookie: string;
  try {
    cookie = await authenticateUCM(
      connection.host,
      connection.port,
      connection.username,
      password,
      connection.verify_ssl ?? false
    );
  } catch (error) {
    throw new Error(
      `UCM authentication failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  console.log(`[Download] UCM authenticated successfully`);

  // 4. Download recording file
  console.log(`[Download] Downloading recording: ${cdr.recording_filename}`);

  let recordingBuffer: Buffer;
  try {
    recordingBuffer = await downloadRecording(
      cookie,
      connection.host,
      connection.port,
      cdr.recording_filename,
      connection.verify_ssl ?? false
    );
  } catch (error) {
    throw new Error(
      `Recording download failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  const recordingSizeBytes = recordingBuffer.length;
  console.log(
    `[Download] Recording downloaded: ${(recordingSizeBytes / 1024).toFixed(2)} KB`
  );

  // 5. Upload to Supabase Storage
  const storagePathPrefix = `${tenantId}/${cdrRecordId}`;
  const recordingExtension = cdr.recording_filename.split('.').pop() || 'wav';
  const recordingPath = `${storagePathPrefix}/recording.${recordingExtension}`;

  console.log(`[Download] Uploading to storage: ${recordingPath}`);

  try {
    await uploadToStorage(
      'call-recordings',
      recordingPath,
      recordingBuffer,
      'audio/wav'
    );
  } catch (error) {
    throw new Error(
      `Storage upload failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }

  console.log(`[Download] Upload successful`);

  // 6. Update CDR record with storage path
  const { error: updateError } = await supabase
    .from('cdr_records')
    .update({
      recording_storage_path: recordingPath,
      recording_size_bytes: recordingSizeBytes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cdrRecordId);

  if (updateError) {
    console.error(
      `[Download] Failed to update CDR record: ${updateError.message}`
    );
    // Don't throw - file is uploaded, this is just metadata update
  }

  return {
    recordingPath,
    recordingSizeBytes,
  };
}
