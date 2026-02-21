/**
 * Drizzle ORM database instance
 *
 * Note: Connection is lazy-initialized to avoid build-time errors
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Lazy initialization to avoid build-time connection attempts
let _client: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getClient() {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _client = postgres(process.env.DATABASE_URL, {
      prepare: false, // Required for Vercel Edge
    });
  }
  return _client;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// Export lazy getters
export const client = new Proxy({} as ReturnType<typeof postgres>, {
  get: (target, prop) => {
    return getClient()[prop as keyof ReturnType<typeof postgres>];
  },
});

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get: (target, prop) => {
    return getDb()[prop as keyof PostgresJsDatabase<typeof schema>];
  },
});

// Export schema for convenience
export * from './schema';
