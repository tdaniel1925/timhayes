/**
 * Drizzle ORM database instance
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// For Vercel Edge/Serverless, we use postgres-js
const connectionString = process.env.DATABASE_URL;

// Create the postgres client
export const client = postgres(connectionString, {
  prepare: false, // Required for Vercel Edge
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';
