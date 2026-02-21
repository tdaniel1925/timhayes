/**
 * Database query functions for pbx_connections table
 */

import { eq, desc, and } from 'drizzle-orm';
import { db } from '../index';
import { pbxConnections, tenants } from '../schema';
import { AppError, DB_ERRORS, createError } from '@/lib/errors';
import { encrypt, decrypt, generateSecret } from '@/lib/encryption';
import type { CreateConnectionInput, UpdateConnectionInput } from '@/lib/validations/connection';

/**
 * Get all PBX connections with tenant info
 */
export async function getAllConnections() {
  try {
    const result = await Promise.race([
      db
        .select({
          id: pbxConnections.id,
          tenantId: pbxConnections.tenantId,
          tenantName: tenants.name,
          name: pbxConnections.name,
          providerType: pbxConnections.providerType,
          host: pbxConnections.host,
          port: pbxConnections.port,
          isActive: pbxConnections.isActive,
          lastConnectedAt: pbxConnections.lastConnectedAt,
          connectionStatus: pbxConnections.connectionStatus,
          webhookUrl: pbxConnections.webhookUrl,
          createdAt: pbxConnections.createdAt,
          updatedAt: pbxConnections.updatedAt,
        })
        .from(pbxConnections)
        .leftJoin(tenants, eq(pbxConnections.tenantId, tenants.id))
        .orderBy(desc(pbxConnections.createdAt)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]);
    return result as any[];
  } catch (error) {
    console.error('[getAllConnections] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get connections for a specific tenant
 */
export async function getConnectionsByTenantId(tenantId: string) {
  try {
    const result = await Promise.race([
      db
        .select()
        .from(pbxConnections)
        .where(eq(pbxConnections.tenantId, tenantId))
        .orderBy(desc(pbxConnections.createdAt)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]);
    return result as any[];
  } catch (error) {
    console.error('[getConnectionsByTenantId] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Get a connection by ID (includes decrypted credentials)
 */
export async function getConnectionById(id: string, includeCredentials: boolean = false) {
  try {
    const result = await Promise.race([
      db.select().from(pbxConnections).where(eq(pbxConnections.id, id)).limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any[];

    if (!result[0]) return null;

    const connection = result[0];

    // Decrypt credentials if requested and present
    if (includeCredentials && connection.apiUsername && connection.apiPassword) {
      return {
        ...connection,
        apiUsername: decrypt(connection.apiUsername),
        apiPassword: decrypt(connection.apiPassword),
      };
    }

    // Remove credentials from response if not requested
    if (!includeCredentials) {
      const { apiUsername, apiPassword, ...connectionWithoutCreds } = connection;
      return connectionWithoutCreds;
    }

    return connection;
  } catch (error) {
    console.error('[getConnectionById] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Create a new PBX connection
 * Automatically generates webhook URL and secret, encrypts credentials
 */
export async function createConnection(data: CreateConnectionInput) {
  try {
    const webhookSecret = generateSecret(32);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate webhook URL based on provider type
    const webhookPath =
      data.providerType === 'grandstream_ucm'
        ? `/api/webhook/grandstream/${crypto.randomUUID()}`
        : `/api/webhook/generic/${crypto.randomUUID()}`;

    const webhookUrl = `${baseUrl}${webhookPath}`;

    // Encrypt credentials if provided
    const encryptedUsername = data.apiUsername ? encrypt(data.apiUsername) : null;
    const encryptedPassword = data.apiPassword ? encrypt(data.apiPassword) : null;

    const result = await db
      .insert(pbxConnections)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        providerType: data.providerType,
        host: data.host,
        port: data.port,
        apiUsername: encryptedUsername,
        apiPassword: encryptedPassword,
        webhookSecret,
        webhookUrl,
        configJson: data.configJson || null,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error: any) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update a PBX connection
 */
export async function updateConnection(id: string, data: UpdateConnectionInput) {
  try {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Encrypt credentials if being updated
    if (data.apiUsername !== undefined) {
      updateData.apiUsername = data.apiUsername ? encrypt(data.apiUsername) : null;
    }
    if (data.apiPassword !== undefined) {
      updateData.apiPassword = data.apiPassword ? encrypt(data.apiPassword) : null;
    }

    const result = await db
      .update(pbxConnections)
      .set(updateData)
      .where(eq(pbxConnections.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(
  id: string,
  status: 'connected' | 'disconnected' | 'error',
  lastConnectedAt?: Date
) {
  try {
    const result = await db
      .update(pbxConnections)
      .set({
        connectionStatus: status,
        lastConnectedAt: lastConnectedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pbxConnections.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Delete a PBX connection
 */
export async function deleteConnection(id: string) {
  try {
    const result = await db.delete(pbxConnections).where(eq(pbxConnections.id, id)).returning();

    return result[0] || null;
  } catch (error) {
    throw createError(DB_ERRORS.CONNECTION_FAILED, error);
  }
}

/**
 * Get connection count by status
 */
export async function getConnectionCountByStatus() {
  try {
    const allConnections = await Promise.race([
      db.select().from(pbxConnections),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any[];

    const counts = {
      connected: 0,
      disconnected: 0,
      error: 0,
      total: allConnections.length,
    };

    allConnections.forEach((conn) => {
      if (conn.connectionStatus === 'connected') counts.connected++;
      else if (conn.connectionStatus === 'disconnected') counts.disconnected++;
      else if (conn.connectionStatus === 'error') counts.error++;
    });

    return counts;
  } catch (error) {
    console.error('[getConnectionCountByStatus] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}

/**
 * Verify webhook secret for a connection
 */
export async function verifyWebhookSecret(connectionId: string, secret: string): Promise<boolean> {
  try {
    const result = await Promise.race([
      db
        .select({ webhookSecret: pbxConnections.webhookSecret })
        .from(pbxConnections)
        .where(and(eq(pbxConnections.id, connectionId), eq(pbxConnections.isActive, true)))
        .limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      )
    ]) as any[];

    if (!result[0]) return false;

    return result[0].webhookSecret === secret;
  } catch (error) {
    console.error('[verifyWebhookSecret] Error:', error);
    throw createError(DB_ERRORS.QUERY_TIMEOUT, error);
  }
}
