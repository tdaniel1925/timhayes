# BUILD-STAGES.md — AudiaPro

> 7-stage incremental build process. Complete each stage fully before proceeding to the next.

---

## Stage 1: Foundation

**Goal:** Project scaffolding, database schema, auth, and basic navigation shell.

**Deliverables:**
1. Next.js 15 project initialized with TypeScript strict, Tailwind CSS, shadcn/ui
2. Drizzle ORM configured with Supabase PostgreSQL connection
3. Complete database schema (all tables from PROJECT-SPEC Gate 2) with migrations
4. RLS policies on all tables
5. Supabase Storage buckets created (recordings, transcripts, exports)
6. Supabase Auth configured (email + password)
7. Auth middleware: redirect unauthenticated users to /login
8. Role-based routing middleware: super_admin → /admin, client_admin → /dashboard
9. Login page, forgot password page, reset password page
10. Dashboard layout shell (sidebar, header) — empty pages with correct routes
11. Admin layout shell — empty pages with correct routes
12. 404, 500, unauthorized, suspended error pages
13. .env.example with all variables documented
14. Sentry error tracking initialized

**Verification:** User can sign up, log in, see correct layout based on role, navigate between empty pages. Database tables exist with correct schema. RLS blocks cross-tenant access.

---

## Stage 2: Super Admin — Tenant & Connection Management

**Goal:** Super Admin can create tenants, add PBX connections, create client admin users, and test connections.

**Deliverables:**
1. Tenants CRUD: list, create, edit, toggle status (enable/disable), delete
2. PBX Connections CRUD: list, create (auto-generates webhook URL + secret), edit, delete
3. Connection test endpoint: authenticates with Grandstream UCM (challenge → hash → login)
4. Users CRUD: list, create (client admin or super admin), edit, toggle active
5. User creation sends welcome email via Resend with temp password link
6. Encryption module: AES-256-GCM encrypt/decrypt for PBX api_username and api_password
7. Zod validation schemas for all forms
8. Admin dashboard page: total tenants count, total connections, connection status summary
9. All admin forms use shadcn/ui components with proper validation feedback

**Verification:** Super Admin can create a tenant → add a Grandstream connection with credentials → test connection succeeds → create a client admin user → user receives welcome email.

---

## Stage 3: Webhook Ingestion & Job Queue

**Goal:** System receives CDR webhooks from Grandstream and queues them for processing.

**Deliverables:**
1. Grandstream webhook endpoint: POST /api/webhook/grandstream/[connectionId]
   - Validates webhook_secret
   - Parses all CDR fields (src, dst, clid, caller_name, start, answer, end, duration, billsec, disposition, recordfiles, session, action_type, action_owner, trunk names)
   - Determines call_direction from dcontext and trunk info
   - Inserts cdr_records row with raw_webhook_payload
   - Creates job_queue entry for answered calls with recordings
   - Returns 200 OK immediately
2. Generic webhook endpoint: POST /api/webhook/generic/[connectionId]
   - Accepts standardized JSON format
   - Same processing pipeline
3. Webhook validation Zod schemas (Grandstream format + generic format)
4. Job queue table operations: create job, claim job (atomic), complete, fail, retry
5. Admin job queue page: view pending/processing/completed/failed jobs, retry failed

**Verification:** POST a sample Grandstream CDR payload to the webhook endpoint → CDR record appears in database → job_queue entry created for answered call → Admin can see job in queue page.

---

## Stage 4: Worker Pipeline — Download, Transcribe, Analyze

**Goal:** Background worker processes calls end-to-end: downloads recording, transcribes, runs AI analysis.

**Deliverables:**
1. Worker entry point (worker/src/index.ts):
   - Express server with /health endpoint
   - Poll loop: query job_queue for pending jobs every 5 seconds
   - Process up to 3 concurrent jobs
   - Graceful shutdown handling
2. Grandstream integration (worker/src/lib/grandstream.ts):
   - authenticate(host, port, username, password) → session cookie
   - downloadRecording(session, host, port, filename) → Buffer
   - SSL verification configurable per connection
3. Download step:
   - Decrypt PBX credentials
   - Auth with UCM
   - Download WAV via RECAPI
   - Upload to Supabase Storage: recordings/{tenant_id}/{YYYY-MM}/{filename}
   - Update cdr_records with storage path, file size, download timestamp
4. Transcription step:
   - Send recording to Deepgram Nova-2 with diarization
   - Parse response: extract utterances, speaker labels, timestamps, words
   - Format transcript JSON
   - Upload to Supabase Storage: transcripts/{tenant_id}/{YYYY-MM}/{cdr_id}.json
   - Update cdr_records.transcript_status
5. AI Analysis step:
   - Load transcript with speaker labels
   - Load tenant's custom keywords
   - Send to Claude Sonnet with structured analysis prompt
   - Parse JSON response
   - Insert call_analyses row
   - Update cdr_records.analysis_status
6. Finalize step:
   - Update job_queue status
   - Increment billing_events.call_count
   - Log processing metrics
7. Error handling:
   - Each step retries 3 times with exponential backoff
   - Failed jobs marked with error_message
   - Partial progress preserved (e.g., recording downloaded but transcription failed)
8. Worker Dockerfile / render.yaml for Render deployment

**Verification:** Create a job_queue entry for a real CDR record → worker picks it up → recording downloads from UCM → transcript appears in storage → AI analysis appears in call_analyses table → job marked completed.

---

## Stage 5: Client Dashboard — Call List & Call Detail

**Goal:** Client Admin sees their calls in a beautiful paginated list and can click into any call for full AI analysis.

**Deliverables:**
1. Dashboard overview page:
   - Stats cards: total calls today, avg duration, avg sentiment score, calls pending analysis
   - Call volume chart (last 30 days, line chart via Recharts)
   - Sentiment distribution (pie/donut chart)
   - Top 5 keywords (horizontal bar chart)
   - Peak hours heatmap (day × hour grid)
2. Calls list page:
   - Paginated data table (25 per page)
   - Columns: date/time, direction (icon), from, to, duration, disposition, sentiment (color dot), AI disposition
   - Filters: date range, direction, disposition, sentiment, search (caller name, number)
   - Sort by: date (default), duration, sentiment score
   - Click row → navigate to call detail
3. Call detail page:
   - Header: call summary card (from, to, date, duration, direction, disposition badge)
   - Recording player: custom audio player with waveform visualization, playback speed control, skip ±15s
   - Transcript viewer: scrollable transcript with speaker labels (color-coded), timestamps, highlight on play position
   - AI Analysis section (card-based layout):
     - Executive Summary card
     - Sentiment card: overall badge + timeline chart (sentiment over call duration)
     - Talk Ratio card: visual bar showing caller vs agent percentage + time
     - Keywords & Topics card: tag cloud + list with counts
     - Action Items card: checklist-style with assignee
     - Compliance card: score gauge + flag checklist
     - Escalation Risk card: badge + reasons
     - Satisfaction Prediction card: score + gauge
     - Questions Asked card: list with speaker labels
     - Objections card: table with objection, response, outcome
     - Custom Keywords card: matches with context snippets (if tenant has custom keywords)
4. Signed URL generation for recording playback (1-hour expiry)
5. Loading skeletons for all data-heavy components
6. Empty states for tenants with no calls yet

**Verification:** Client Admin logs in → sees dashboard with real analytics → navigates to call list → filters by date range → clicks a call → sees full recording player, transcript, and all AI analysis cards populated with real data.

---

## Stage 6: Reports, Email, Billing & Settings

**Goal:** Reports export, scheduled email analytics, billing tracking, and user settings.

**Deliverables:**
1. CSV export:
   - Export filtered calls list as CSV
   - Configurable columns: date, from, to, duration, disposition, sentiment, summary, keywords
   - Downloads immediately via signed URL
2. PDF report:
   - Analytics summary report for date range
   - Generated server-side with charts
   - Includes: call volume, sentiment trends, top keywords, agent performance
3. Email report preferences (Settings page):
   - Toggle daily/weekly/monthly email reports
   - Preview of what the email will look like
4. Worker cron: email report generation
   - Worker checks email_reports table hourly
   - Generates HTML email with key metrics
   - Sends via Resend with AudiaPro branding
5. Billing page (Client Admin):
   - Current month: call count, estimated charges
   - History: previous months with totals and status
6. Billing overview (Super Admin):
   - All tenants with current month charges
   - Mark invoices as paid/overdue
   - Highlight overdue accounts
7. Billing events automation:
   - Auto-create billing_events row for new month when first call arrives
   - Increment call_count on each processed call
8. Settings page (Client Admin):
   - Custom keywords management: add, edit, delete, categorize
   - Profile: update name, email
   - Email preferences

**Verification:** Client Admin exports calls as CSV → downloads correctly. Scheduled email report triggers and delivers to inbox. Super Admin views billing across all tenants, marks invoice as paid. Client Admin adds custom keywords, next analyzed call includes matches.

---

## Stage 7: Polish, Testing & Deployment

**Goal:** Production-ready polish, comprehensive testing, performance optimization, and deployment.

**Deliverables:**
1. Accessibility audit:
   - Keyboard navigation on all interactive elements
   - ARIA labels on buttons, forms, charts, data tables
   - Focus indicators visible
   - Screen reader testing on call list and detail pages
   - Color contrast verification (WCAG AA)
2. Performance optimization:
   - Lighthouse score > 90 on all 4 categories
   - Image optimization (Next.js Image component)
   - Code splitting (dynamic imports for heavy components like charts)
   - Database query optimization (check EXPLAIN on slow queries)
   - API response caching where appropriate (analytics data)
3. Security hardening:
   - CSP headers configured
   - CORS whitelist
   - Rate limiting on webhook and API endpoints
   - Verify no PBX credentials leak in logs or responses
   - Verify RLS blocks all cross-tenant access
   - Input sanitization audit
4. User onboarding:
   - Client Admin onboarding modal (first login)
   - Quick tour highlighting key features
   - Empty state messages guiding new users
5. Testing:
   - Unit tests: webhook parsing, Grandstream auth flow, encryption, analytics queries
   - Integration tests: full pipeline (mock Deepgram + Claude, real DB)
   - E2E tests: login, dashboard navigation, call list filtering, call detail view
   - Load test: webhook endpoint handles 100 req/min
6. Documentation:
   - README.md with setup instructions
   - API documentation (webhook payload formats)
   - PBX connection setup guide (for Grandstream)
7. Deployment:
   - Vercel deployment configured (Next.js app)
   - Render deployment configured (worker service)
   - Environment variables set in both platforms
   - Custom domain (audiapro.com) configured on Vercel
   - SSL certificates verified
   - Health checks configured on Render worker
8. Branded emails finalized:
   - Welcome email template
   - Password reset template
   - Account suspended / reactivated templates
   - Analytics report templates (daily/weekly/monthly)
9. Landing page:
   - Hero section with value prop
   - Feature highlights with icons
   - Pricing section ($349/mo + $0.10/call)
   - CTA to contact for setup
   - Footer with BotMakers branding

**Verification:** Lighthouse > 90 on all pages. All tests pass. Deploy to production. Create real tenant, connect real Grandstream UCM, make test call, verify full pipeline: webhook → recording download → transcript → AI analysis → visible in dashboard with all analytics. Email report delivers. CSV export works. Admin can suspend and reactivate account.
