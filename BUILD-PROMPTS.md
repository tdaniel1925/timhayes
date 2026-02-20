# BUILD-PROMPTS.md — AudiaPro

> Copy-paste each prompt into Claude Code when ready to build that stage.
> Complete each stage fully before moving to the next.

---

## Stage 1 Prompt: Foundation

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before doing anything.

You are building Stage 1: Foundation for AudiaPro — an AI-powered call recording and analytics SaaS.

TASKS:
1. Initialize Next.js 15 with App Router, TypeScript strict, Tailwind CSS
2. Install and configure shadcn/ui (dark mode default, coral #FF7F50 primary)
3. Install and configure Drizzle ORM with Supabase PostgreSQL
4. Create COMPLETE database schema in src/lib/db/schema.ts — ALL tables from PROJECT-SPEC Gate 2: tenants, users, pbx_connections, cdr_records, call_analyses, custom_keywords, job_queue, email_reports, billing_events. All enums, columns, types exactly as specified.
5. Generate Drizzle migrations and SQL migration files in supabase/migrations/
6. Create RLS policies: super_admin full access, client_admin SELECT where tenant_id matches, service role bypasses RLS
7. Create Supabase Storage buckets: recordings (private), transcripts (private), exports (private)
8. Configure Supabase Auth (email + password)
9. Create auth middleware (src/middleware.ts): unauthenticated → /login, super_admin → /admin/*, client_admin → /dashboard/*, suspended tenant → /suspended
10. Create ALL page routes with layouts but placeholder content (see PROJECT-SPEC Gate 3 for complete list)
11. Create layout shells: Dashboard sidebar (Calls, Reports, Settings, Billing) + header. Admin sidebar (Dashboard, Tenants, Connections, Users, Jobs, Billing, Calls, Health) + header.
12. Create .env.example with ALL env vars from PROJECT-SPEC
13. Initialize Sentry error tracking
14. Create src/lib/errors.ts with CodeBakers error codes (CB-AUTH-001 through CB-SMS-001)

Use Inter font. Dark mode with colors from CLAUDE.md. Mobile-first. WCAG AA.
After completing, update BUILD-STATE.md.
```

---

## Stage 2 Prompt: Super Admin — Tenant & Connection Management

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 2: Super Admin — Tenant & Connection Management.

TASKS:
1. Encryption module (src/lib/encryption.ts): AES-256-GCM encrypt/decrypt for PBX credentials using ENCRYPTION_KEY env var
2. Tenant CRUD: API routes (GET/POST /api/tenants, GET/PATCH/DELETE /api/tenants/[id], POST toggle-status). Admin pages: list (data table), create form, edit form. Zod schemas. Form fields: name, slug, billing_email, rates, notes. Toggle Active/Suspended with confirmation.
3. PBX Connection CRUD: API routes + admin pages. Form: tenant dropdown, name, provider_type (grandstream_ucm/freepbx/3cx/generic_webhook), host, port, api_username (encrypted), api_password (encrypted), config_json. Auto-generate webhook_secret (32-byte hex) and webhook_url on create. Display webhook URL+secret as copyable.
4. Connection test endpoint for Grandstream: decrypt creds → GET /api/challenge → MD5(challenge+password) → POST /api/login → verify session cookie. Return success/failure.
5. User CRUD: API routes + admin pages. Form: email, full_name, role, tenant. On create: Supabase Auth user + welcome email via Resend.
6. Resend email setup (src/lib/integrations/resend.ts): welcome, suspended, reactivated templates with AudiaPro branding.
7. Admin dashboard: stats cards (tenants, connections, calls today, failed jobs).

All forms: validation feedback, loading states, success/error toasts.
All tables: sorting, search, pagination.
After completing, update BUILD-STATE.md.
```

---

## Stage 3 Prompt: Webhook Ingestion & Job Queue

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 3: Webhook Ingestion & Job Queue.

TASKS:
1. Grandstream webhook endpoint (POST /api/webhook/grandstream/[connectionId]/route.ts):
   - Validate webhook_secret from query param or X-Webhook-Secret header
   - Look up pbx_connection, verify active + tenant active
   - Parse Grandstream CDR Real-Time Output fields: accountcode, src, dst, dcontext, clid, channel, dstchannel, lastapp, lastdata, start, answer, end, duration, billsec, disposition, amaflags, uniqueid, userfield, channel_ext, dstchannel_ext, service, caller_name, recordfiles, dstanswer, chanext, dstchanext, session, action_owner, action_type, src_trunk_name, dst_trunk_name
   - Determine call_direction: if dcontext contains "from-internal" and dst_trunk_name exists → outbound. If src_trunk_name exists → inbound. Otherwise → internal.
   - Insert cdr_records row with all parsed fields + raw_webhook_payload
   - If disposition=ANSWERED and recordfiles not empty → create job_queue entry (type: full_pipeline)
   - If not answered → set transcript_status and analysis_status to 'skipped'
   - Return 200 OK

2. Generic webhook endpoint (POST /api/webhook/generic/[connectionId]/route.ts):
   - Standard format: call_id, direction, from, to, caller_name, start_time, end_time, duration, status, recording_url, recording_filename
   - Same processing flow

3. Zod validation schemas for both webhook formats
4. Job queue operations: createJob, claimNextJob (atomic UPDATE...RETURNING), completeJob, failJob, retryJob
5. Admin job queue page (/admin/jobs): data table showing all jobs with status filters, retry button for failed jobs, bulk retry

After completing, update BUILD-STATE.md.
```

---

## Stage 4 Prompt: Worker Pipeline

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 4: Worker Pipeline — Download, Transcribe, Analyze.

This is the background worker that runs on Render as a separate Node.js service.

TASKS:
1. Create worker/ directory with its own package.json, tsconfig.json
2. Worker entry (worker/src/index.ts):
   - Express server on PORT env var with /health endpoint returning {status: "ok", queue_depth: N}
   - Poll loop: every 5 seconds, query job_queue for pending jobs ordered by priority DESC, created_at ASC
   - Process up to 3 concurrent jobs using a semaphore/pool
   - Graceful shutdown on SIGTERM/SIGINT
3. Grandstream client (worker/src/lib/grandstream.ts):
   - authenticate(host, port, username, password): GET /api/challenge → MD5(challenge+password) → POST /api/login → return session cookie. Handle SSL self-signed certs (verify=false configurable).
   - downloadRecording(sessionCookie, host, port, filename): GET /api/recapi?recording_file={filename} → return Buffer
4. Download step (worker/src/steps/download.ts):
   - Decrypt PBX credentials (same encryption module)
   - Authenticate with UCM
   - Download WAV file
   - Upload to Supabase Storage: recordings/{tenant_id}/{YYYY-MM}/{filename}
   - Update cdr_records: recording_storage_path, recording_downloaded=true, recording_size_bytes, recording_downloaded_at
   - Retry 3x with exponential backoff (2s, 4s, 8s)
5. Transcription step (worker/src/steps/transcribe.ts):
   - Download recording buffer from Supabase Storage
   - POST to Deepgram API (https://api.deepgram.com/v1/listen) with: model=nova-2, diarize=true, smart_format=true, punctuate=true, paragraphs=true, utterances=true
   - Parse response into structured transcript JSON: {speakers, utterances: [{speaker, text, start, end}], paragraphs, words}
   - Upload transcript JSON to Supabase Storage: transcripts/{tenant_id}/{YYYY-MM}/{cdr_id}.json
   - Update cdr_records: transcript_storage_path, transcript_status=completed
   - Retry 3x
6. AI Analysis step (worker/src/steps/analyze.ts):
   - Load transcript text with speaker labels
   - Load tenant custom_keywords
   - Send to Anthropic API (claude-sonnet-4-5-20250929) with structured analysis prompt from PROJECT-SPEC Gate 5
   - Parse JSON response
   - Insert call_analyses row with ALL fields
   - Update cdr_records: analysis_status=completed
   - Retry 3x
7. Finalize step (worker/src/steps/finalize.ts):
   - Mark job completed
   - UPSERT billing_events: increment call_count for tenant+month
   - Log total processing time and per-step times
8. Pipeline orchestrator (worker/src/pipeline.ts):
   - Runs steps in sequence: download → transcribe → analyze → finalize
   - If any step fails after retries, mark job as failed with error_message
   - Preserve partial progress (e.g., recording downloaded but transcription failed — don't re-download)
9. Cron: email reports (worker/src/cron/email-reports.ts):
   - Every hour, check email_reports for next_send_at <= now()
   - Generate analytics HTML email for the period
   - Send via Resend
   - Update last_sent_at, calculate next_send_at

After completing, update BUILD-STATE.md.
```

---

## Stage 5 Prompt: Client Dashboard — Call List & Call Detail

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 5: Client Dashboard — Call List & Call Detail.

This is the main client-facing experience. Make it beautiful.

TASKS:
1. Analytics API routes:
   - GET /api/analytics/overview: total calls, avg duration, avg sentiment, calls pending (date range param)
   - GET /api/analytics/trends: time-series call volume + sentiment (date range, granularity: day/week/month)
   - GET /api/analytics/keywords: top keywords with counts (date range, limit)
   - GET /api/analytics/heatmap: call count by hour-of-day × day-of-week
   - GET /api/analytics/agents: per-extension metrics (call count, avg duration, avg sentiment)
   All auto-filtered by tenant_id for client_admin.

2. Dashboard overview page (/dashboard):
   - Stats cards row: Total Calls (with trend arrow), Avg Duration, Avg Sentiment (color-coded), Pending Analysis
   - Call Volume chart: line chart (Recharts) showing calls per day for last 30 days, with inbound/outbound as separate lines
   - Sentiment Distribution: donut chart (positive/neutral/negative/mixed percentages)
   - Top Keywords: horizontal bar chart, top 10 keywords
   - Call Heatmap: grid showing call volume by hour (rows) × day of week (columns), color intensity = volume
   - Date range picker at top to adjust all charts

3. Calls list page (/dashboard/calls):
   - Paginated data table, 25 per page
   - Columns: Date/Time, Direction (inbound/outbound/internal icon), From, To, Duration (formatted mm:ss), Disposition (badge), Sentiment (colored dot: green/yellow/red), AI Disposition (badge)
   - Filters: date range picker, direction dropdown, disposition dropdown, sentiment dropdown, search input (matches caller name, src, dst)
   - Sort by: date (default desc), duration, sentiment_score
   - Click any row → navigate to /dashboard/calls/[id]
   - Show total results count and current page

4. Calls API route:
   - GET /api/calls: paginated, filterable, sortable. Joins call_analyses for sentiment display.
   - GET /api/calls/[id]: full CDR record + call_analyses + signed recording URL + transcript
   - GET /api/calls/[id]/recording-url: generate Supabase signed URL (1 hour expiry)
   - GET /api/calls/[id]/transcript: return transcript JSON

5. Call detail page (/dashboard/calls/[id]) — THIS IS THE HERO PAGE, make it stunning:
   - Header card: From → To, date/time, duration, direction badge, disposition badge, AI disposition badge
   - Recording Player section:
     - Custom audio player with play/pause, progress bar, current time/total time
     - Playback speed control (0.5x, 1x, 1.5x, 2x)
     - Skip forward/back 15 seconds buttons
     - Volume control
   - Transcript Viewer section:
     - Scrollable transcript with speaker labels (Speaker 1 / Speaker 2, color-coded)
     - Timestamps on each utterance
     - Click timestamp to seek recording to that point
   - AI Analysis section (cards in a responsive grid):
     - Executive Summary: text card with the 2-3 sentence summary
     - Sentiment Analysis: overall badge + timeline chart (line graph of sentiment score over call duration)
     - Talk Ratio: visual horizontal bar (caller % vs agent %), plus time in seconds for each
     - Keywords & Topics: tag pills for keywords (sized by count), topic list with relevance bars
     - Action Items: checklist with description, assignee badge, deadline if mentioned
     - Compliance: circular gauge (0-100%), checklist of flags with pass/fail icons
     - Escalation Risk: large badge (Low/Medium/High with color), reasons listed
     - Satisfaction Prediction: gauge + badge
     - Questions Asked: list grouped by speaker with question text
     - Objections: table with objection, response, outcome (resolved/unresolved badge)
     - Custom Keywords: tag pills with match count, expandable to show context snippets (only show if tenant has custom keywords)
   - Silence/Dead Air: shown in header card as "X seconds silence detected"

6. Loading skeletons for all heavy components (dashboard charts, call list, call detail)
7. Empty states: "No calls yet" with explanation for new tenants

Use Recharts for all charts. Use shadcn/ui components as base.
Dark mode. Coral accents. Smooth transitions and hover effects.
After completing, update BUILD-STATE.md.
```

---

## Stage 6 Prompt: Reports, Email, Billing & Settings

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 6: Reports, Email, Billing & Settings.

TASKS:
1. CSV Export:
   - POST /api/reports/export-csv: accepts date range + column selection + filters
   - Generate CSV server-side with selected fields (date, from, to, duration, disposition, sentiment, summary, keywords)
   - Upload to Supabase Storage exports bucket, return signed URL
   - UI: export button on calls list page, opens config modal

2. PDF Report:
   - POST /api/reports/export-pdf: accepts date range
   - Generate PDF with analytics summary: call volume chart, sentiment breakdown, top keywords, call stats
   - Use a PDF generation library (e.g., @react-pdf/renderer or jsPDF)
   - Upload to exports bucket, return signed URL

3. Reports page (/dashboard/reports):
   - Date range selector
   - Preview of report metrics
   - Export CSV button, Export PDF button
   - History of generated reports with download links

4. Email Report Preferences:
   - GET/POST /api/reports/email-preferences
   - Settings page section (/dashboard/settings): toggle daily/weekly/monthly email reports
   - Show preview of what the email contains

5. Worker cron for email reports (if not built in Stage 4):
   - Hourly check of email_reports where next_send_at <= now()
   - Generate HTML email with: total calls, avg duration, sentiment distribution, top 5 keywords, top 3 notable calls (highest/lowest sentiment)
   - Send via Resend with AudiaPro branding
   - Update timestamps

6. Client Billing page (/dashboard/billing):
   - Current month card: call count, monthly rate, per-call charges, estimated total
   - Billing history table: month, call count, total charge, status badge (paid/invoiced/overdue)

7. Super Admin Billing page (/admin/billing):
   - All tenants billing table: tenant name, current month calls, monthly rate, per-call total, grand total, status
   - Click tenant → edit billing_events, mark as paid/overdue
   - Highlight overdue accounts in red
   - Summary cards: total revenue this month, total overdue, total active tenants

8. Billing automation:
   - On each processed call (in worker finalize step): UPSERT billing_events for tenant+current month, increment call_count
   - Calculate totals: total_charge = monthly_charge + (call_count × per_call_rate)

9. Client Settings page (/dashboard/settings):
   - Profile section: edit name, email
   - Custom Keywords section: add/edit/delete keywords with category tags. Data table with keyword, category, actions.
   - Email Preferences section: report toggles

10. Branded email templates (finalize all):
    - Welcome email (with setup link)
    - Password reset
    - Account suspended
    - Account reactivated
    - Daily/Weekly/Monthly analytics report

After completing, update BUILD-STATE.md.
```

---

## Stage 7 Prompt: Polish, Testing & Deployment

```
Read PROJECT-SPEC.md, CLAUDE.md, BUILD-STAGES.md, BUILD-STATE.md before starting.

Building Stage 7: Polish, Testing & Deployment.

TASKS:
1. Accessibility:
   - Audit all pages for keyboard navigation
   - Add ARIA labels to all buttons, form fields, data tables, charts
   - Add visible focus indicators
   - Verify color contrast ≥ 4.5:1 (use WCAG checker)
   - Add skip-to-content link
   - Ensure recording player is keyboard-operable
   - Add alt text on all images/icons

2. Performance:
   - Run Lighthouse on all pages, target > 90 on all 4 categories
   - Add dynamic imports for Recharts components (code splitting)
   - Optimize images with next/image
   - Add API response caching for analytics (1-minute cache for dashboard)
   - Review database queries with EXPLAIN, add missing indexes
   - Implement virtual scrolling on call list if needed

3. Security:
   - Configure CSP headers in next.config.ts
   - Configure CORS in API routes (whitelist audiapro.com)
   - Add rate limiting: webhooks 100/min per connection, API 60/min per user
   - Audit: no PBX credentials in logs, API responses, or client-side code
   - Verify RLS: test that client_admin cannot access other tenant's data
   - Input sanitization on all user inputs
   - Verify webhook_secret validation cannot be bypassed

4. Onboarding:
   - Client Admin first-login onboarding modal: welcome message, brief tour of dashboard → calls → call detail → settings
   - Set flag in user record after onboarding dismissed
   - Empty states on all pages for new tenants with helpful messaging

5. Testing:
   - Unit tests (Vitest):
     - Grandstream CDR webhook payload parsing
     - Grandstream auth flow (mock HTTP)
     - Encryption encrypt/decrypt roundtrip
     - Analytics query builders
     - Zod schema validation (valid + invalid payloads)
   - Integration tests:
     - Full pipeline: mock webhook → job created → mock Deepgram → mock Claude → verify DB records
     - Tenant CRUD with RLS verification
   - E2E tests (Playwright):
     - Login flow (valid + invalid credentials)
     - Dashboard loads with charts
     - Call list: filter, sort, paginate, click into detail
     - Call detail: recording player renders, transcript visible, analysis cards populated
     - Admin: create tenant → create connection → create user
   - Load test: send 100 webhook requests/minute, verify all processed

6. Landing page (/):
   - Hero: "AI-Powered Call Analytics for Every Phone System" with gradient background
   - Features grid: Auto-Recording, AI Transcription, Sentiment Analysis, Custom Keywords, Compliance Scoring, Email Reports
   - Pricing: $349/month + $0.10/call
   - CTA: "Contact us to get started" with mailto or calendly link
   - Footer: BotMakers Inc. branding, links

7. Documentation:
   - README.md: project overview, local dev setup, env vars, deployment
   - WEBHOOK-SETUP.md: how to configure Grandstream UCM CDR Real-Time Output to point at AudiaPro
   - API.md: webhook payload formats for Grandstream and generic

8. Deployment:
   - Vercel: configure project, set all env vars, link audiapro.com domain
   - Render: configure worker service, set env vars, health check /health
   - Verify: make a test call on connected Grandstream → webhook received → recording downloaded → transcript generated → AI analysis complete → visible in dashboard

After completing, update BUILD-STATE.md to mark all stages complete.
```
