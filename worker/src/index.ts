/**
 * AudiaPro Worker Service
 * Polls job queue and processes call recordings through AI pipeline
 */

import express, { Request, Response } from 'express';
import { supabase } from './lib/supabase.js';
import { processPipeline } from './pipeline.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_CONCURRENT_JOBS = 3;

// Track active jobs
const activeJobs = new Set<string>();
let isShuttingDown = false;

// Job type from database
interface Job {
  id: string;
  tenant_id: string;
  cdr_record_id: string;
  job_type: string;
  status: string;
  priority: number;
  attempts: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Health check server for Render
 */
const app = express();

app.get('/health', (req: Request, res: Response) => {
  const status = {
    status: 'healthy',
    uptime: process.uptime(),
    activeJobs: activeJobs.size,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    isShuttingDown,
    timestamp: new Date().toISOString(),
  };

  res.json(status);
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'AudiaPro Worker',
    version: '1.0.0',
    status: 'running',
  });
});

const server = app.listen(PORT, () => {
  console.log(`[Worker] Health check server listening on port ${PORT}`);
  console.log(`[Worker] Service started - polling every ${POLL_INTERVAL_MS}ms`);
  console.log(`[Worker] Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
});

/**
 * Claim and process next available job
 */
async function claimAndProcessJob(): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  if (activeJobs.size >= MAX_CONCURRENT_JOBS) {
    return;
  }

  try {
    // Claim next job atomically using FOR UPDATE SKIP LOCKED
    const { data: job, error } = await supabase.rpc('claim_next_job').single() as { data: Job | null; error: any };

    if (error) {
      if (error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (no jobs available)
        console.error(`[Worker] Error claiming job: ${error.message}`);
      }
      return;
    }

    if (!job) {
      return; // No jobs available
    }

    // Track active job
    activeJobs.add(job.id);
    console.log(
      `[Worker] Claimed job ${job.id} (${activeJobs.size}/${MAX_CONCURRENT_JOBS} active)`
    );

    // Process job asynchronously
    processPipeline(job)
      .then((result) => {
        if (result.success) {
          console.log(`[Worker] Job ${job.id} completed successfully`);
        } else {
          console.error(`[Worker] Job ${job.id} failed: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error(
          `[Worker] Unexpected error processing job ${job.id}: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      })
      .finally(() => {
        activeJobs.delete(job.id);
        console.log(
          `[Worker] Job ${job.id} finished (${activeJobs.size}/${MAX_CONCURRENT_JOBS} active)`
        );
      });
  } catch (error) {
    console.error(
      `[Worker] Unexpected error in claimAndProcessJob: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

/**
 * Main polling loop
 */
async function pollLoop(): Promise<void> {
  while (!isShuttingDown) {
    try {
      // Try to claim and process jobs up to max concurrent limit
      const availableSlots = MAX_CONCURRENT_JOBS - activeJobs.size;

      for (let i = 0; i < availableSlots; i++) {
        await claimAndProcessJob();
      }
    } catch (error) {
      console.error(
        `[Worker] Error in poll loop: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }

    // Wait before next poll
    await sleep(POLL_INTERVAL_MS);
  }

  console.log('[Worker] Poll loop stopped');
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`[Worker] Received ${signal}, starting graceful shutdown...`);
  isShuttingDown = true;

  // Stop accepting new HTTP requests
  server.close(() => {
    console.log('[Worker] Health check server closed');
  });

  // Wait for active jobs to complete (with timeout)
  const shutdownTimeout = 60000; // 60 seconds
  const shutdownStart = Date.now();

  while (activeJobs.size > 0) {
    const elapsed = Date.now() - shutdownStart;
    if (elapsed > shutdownTimeout) {
      console.warn(
        `[Worker] Shutdown timeout reached with ${activeJobs.size} jobs still active`
      );
      break;
    }

    console.log(
      `[Worker] Waiting for ${activeJobs.size} active jobs to complete...`
    );
    await sleep(2000);
  }

  console.log('[Worker] All jobs completed, shutting down');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Worker] Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Worker] Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the polling loop
console.log('[Worker] Starting job polling loop...');
pollLoop().catch((error) => {
  console.error(
    `[Worker] Fatal error in poll loop: ${error instanceof Error ? error.message : 'Unknown'}`
  );
  process.exit(1);
});
