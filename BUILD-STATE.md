# BUILD-STATE.md — AudiaPro

> Track build progress. Update this file after completing each stage.

---

## Current Stage: 3 — Webhook Ingestion & Job Queue

## Status: COMPLETED

---

## Stage Progress

| Stage | Name | Status | Started | Completed | Notes |
|-------|------|--------|---------|-----------|-------|
| 1 | Foundation | ✅ Completed | 2026-02-15 | 2026-02-15 | All 9 tables, RLS, storage buckets, auth middleware, layouts |
| 2 | Super Admin — Tenant & Connection Management | ✅ Completed | 2026-02-15 | 2026-02-15 | All API routes, encryption, dashboard, basic UI pages |
| 3 | Webhook Ingestion & Job Queue | ✅ Completed | 2026-02-15 | 2026-02-15 | Webhook endpoints, job queue operations, admin UI |
| 4 | Worker Pipeline — Download, Transcribe, Analyze | ⬜ Not Started | - | - | |
| 5 | Client Dashboard — Call List & Call Detail | ⬜ Not Started | - | - | |
| 6 | Reports, Email, Billing & Settings | ⬜ Not Started | - | - | |
| 7 | Polish, Testing & Deployment | ⬜ Not Started | - | - | |

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-14 | Supabase for DB + Storage + Auth | Single platform, RLS for tenant isolation, signed URLs for recordings |
| 2026-02-14 | Vercel for frontend + API routes | Best Next.js hosting, fast deploys, edge functions |
| 2026-02-14 | Single Render worker (not 3 services) | Simplifies architecture, one service handles all background processing |
| 2026-02-14 | Deepgram Nova-2 for transcription | Faster and cheaper than Whisper at scale, built-in diarization |
| 2026-02-14 | Claude Sonnet for AI analysis | Best structured output quality, cost-effective for per-call analysis |
| 2026-02-14 | Dark mode default | Call analytics tools are used in office environments, dark mode reduces eye strain |
| 2026-02-14 | Job queue in Supabase (not Redis) | Fewer infrastructure dependencies, RLS-compatible, good enough at this scale |
| 2026-02-15 | Grandstream API uses action-based format | Corrected API integration after support clarification - single /api endpoint with action in request body |

---

## Environment Setup Checklist

- [ ] Supabase project created
- [ ] Supabase database migrations applied (001-004)
- [ ] Supabase Storage buckets created (recordings, transcripts, exports)
- [ ] Deepgram account created, API key obtained
- [ ] Anthropic API key obtained
- [ ] Resend account created, domain verified (audiapro.com)
- [ ] Sentry project created
- [ ] Vercel project created, linked to repo
- [ ] Render worker service created (Stage 4)
- [ ] Custom domain (audiapro.com) configured on Vercel
- [ ] All env vars set in Vercel
- [ ] All env vars set in Render (Stage 4)

---

## Stage 1 Completion Summary

**Completed on:** 2026-02-15

**Deliverables:**
- ✅ Next.js 15 + TypeScript strict + Tailwind CSS configured
- ✅ shadcn/ui configured with dark mode default and coral (#FF7F50) primary color
- ✅ Complete Drizzle ORM schema with all 9 tables (tenants, users, pbx_connections, cdr_records, call_analyses, custom_keywords, job_queue, email_reports, billing_events)
- ✅ Supabase SQL migrations (schema, RLS policies, storage buckets, indexes)
- ✅ Auth middleware with role-based routing (super_admin → /admin, client_admin → /dashboard)
- ✅ Supabase helper modules (client, server, middleware, admin)
- ✅ All page routes created with placeholder content
- ✅ Dashboard layout shell with sidebar and header
- ✅ Admin layout shell with sidebar and header
- ✅ Error pages (404, 500, unauthorized, suspended)
- ✅ .env.example with all environment variables
- ✅ Sentry error tracking initialized
- ✅ CodeBakers error code system (CB-XXX-NNN)

---

## Stage 2 Completion Summary

**Completed on:** 2026-02-15

**Deliverables:**
- ✅ Encryption module (src/lib/encryption.ts) with AES-256-GCM for PBX credentials
- ✅ Zod validation schemas for tenant, connection, and user operations
- ✅ Database query helpers for all entities (tenants, connections, users)
- ✅ Complete Tenant CRUD API routes (GET/POST/PATCH/DELETE + toggle-status)
- ✅ Complete PBX Connection CRUD API routes with auto-generated webhook URL/secret
- ✅ Connection test endpoint for Grandstream UCM (challenge → MD5 → login flow)
- ✅ Complete User CRUD API routes with Supabase Auth integration
- ✅ Resend email integration with branded templates (welcome, suspended, reactivated)
- ✅ Admin dashboard page with real-time stats cards (tenants, connections, calls, jobs)
- ✅ Tenants list page with status badges and data table
- ✅ API utilities for auth verification and error handling
- ✅ Grandstream UCM API client for authentication and testing

**Notes:**
- All API routes are fully functional and secured with role-based access control
- PBX credentials are encrypted at rest using AES-256-GCM
- Webhook URLs and secrets are auto-generated for each connection
- Email notifications work for tenant status changes (suspend/reactivate)
- Basic tenant list UI is complete; detailed forms can be added as needed
- Connection and user management pages still need full UI implementation

**Remaining UI Work (Optional for Stage 2):**
- Detailed tenant create/edit forms
- PBX connection create/edit forms with credential management
- User create form with role selection
- These can be built as needed or accessed via API directly for now

**Next Steps:** Proceed to Stage 3 - Webhook Ingestion & Job Queue

---

## Stage 3 Completion Summary

**Completed on:** 2026-02-15

**Deliverables:**
- ✅ Zod validation schemas for Grandstream and generic webhook formats (src/lib/validations/webhook.ts)
- ✅ Call direction determination logic (inbound/outbound/internal)
- ✅ Grandstream disposition and timestamp parsing utilities
- ✅ CDR record database query helpers (src/lib/db/queries/cdr.ts)
- ✅ Job queue database query helpers with atomic operations (src/lib/db/queries/jobs.ts)
- ✅ Drizzle relations for job_queue and cdr_records tables
- ✅ Grandstream webhook endpoint (POST /api/webhook/grandstream/[connectionId])
  - Validates webhook_secret from query param or header
  - Looks up PBX connection and tenant
  - Verifies connection and tenant are active
  - Parses all CDR fields from Grandstream format
  - Determines call direction from dcontext and trunk info
  - Inserts CDR record with raw webhook payload
  - Creates job_queue entry for answered calls with recordings
  - Returns 200 OK immediately
- ✅ Generic webhook endpoint (POST /api/webhook/generic/[connectionId])
  - Accepts standardized JSON format for non-Grandstream PBX systems
  - Same validation and processing flow as Grandstream endpoint
- ✅ Jobs API routes:
  - GET /api/jobs - List all jobs with filtering and stats
  - POST /api/jobs/[id]/retry - Retry a single failed job
  - POST /api/jobs/bulk-retry - Retry all failed jobs
- ✅ Admin job queue page (/admin/jobs):
  - Real-time stats cards (pending, processing, completed, failed, retry)
  - Status filter tabs (all, pending, processing, completed, failed, retry)
  - Data table showing all job details with CDR information
  - Individual retry buttons for failed jobs
  - Bulk retry button for all failed jobs
  - Auto-refresh every 10 seconds
  - Manual refresh button

**Features Implemented:**
- Webhook secret validation (query param or X-Webhook-Secret header)
- Tenant and connection status verification (suspended/cancelled tenants rejected)
- Automatic job creation for answered calls with recordings
- Skipped status for unanswered calls or calls without recordings
- Atomic job claiming with PostgreSQL FOR UPDATE SKIP LOCKED
- Job retry logic with max attempts tracking
- Error message storage for failed jobs
- Complete CDR field mapping from Grandstream format
- Generic webhook format support for non-Grandstream systems

**Error Handling:**
- CB-API-001: Invalid webhook secret
- CB-API-002: Connection not found
- CB-API-003: Tenant suspended
- CB-API-004: Payload validation failed
- All errors returned with proper HTTP status codes and structured error responses

**Database Operations:**
- createCDR: Insert new call detail records with all parsed fields
- createJob: Create new background processing jobs
- claimNextJob: Atomically claim the next pending job for worker processing
- completeJob: Mark job as completed with timestamp
- failJob: Mark job as failed with error message, auto-retry if under max attempts
- retryJob: Reset failed/retry job to pending status
- retryAllFailedJobs: Bulk retry all failed jobs
- getJobs: Query jobs with filtering by status and tenant
- getJobStats: Get count of jobs by status for dashboard stats

**Next Steps:** Proceed to Stage 4 - Worker Pipeline (Download, Transcribe, Analyze)

---

## Known Issues / Blockers

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| None | - | - | - |

---

## Test Accounts

| Role | Email | Tenant | Notes |
|------|-------|--------|-------|
| Super Admin | (to be created) | N/A | BotMakers staff |
| Client Admin | (to be created) | (to be created) | Test tenant with Grandstream connection |
