# PROJECT-SPEC.md — AudiaPro

> **Version:** 1.0.0
> **Generated:** 2026-02-14
> **Generator:** CodeBakers by BotMakers Inc.
> **Mode:** Full Build (7 Stages)

---

## Gate 0: Project Overview

### Identity

| Field | Value |
|-------|-------|
| App Name | AudiaPro |
| Domain | audiapro.com |
| Tagline | AI-Powered Call Recording & Analytics for Every Business Phone System |
| Client | BotMakers Inc. (SaaS product) |
| Industry | Business Communications / Call Analytics |
| Target Market | Business owners, medium-to-large orgs using Grandstream and other PBX systems |

### Problem Statement

Businesses running on-premise or cloud PBX systems (Grandstream UCM, FreePBX, 3CX, etc.) lack an easy, automated way to:

1. Capture and store every inbound/outbound call recording
2. Get full transcripts with speaker identification
3. Receive AI-powered analysis of every conversation — sentiment, keywords, compliance, action items
4. View aggregate analytics across all calls over time

Existing solutions are either enterprise-priced (Gong at $250+/user/mo, CallMiner custom pricing) or limited to basic recording without intelligence. There is no affordable SaaS that connects directly to PBX systems via webhook + API, auto-downloads recordings, transcribes them, and delivers rich AI analytics through a beautiful dashboard.

### Value Proposition

AudiaPro connects to any PBX that supports webhooks and recording APIs, automatically downloads every call recording, transcribes it with speaker diarization, and runs AI analysis to surface actionable insights — all for $349/month + $0.10/call. Business owners see every conversation analyzed for sentiment, keywords, compliance, and follow-up items without any manual effort.

### Competitor Analysis

| Competitor | Price | Weakness AudiaPro Exploits |
|-----------|-------|---------------------------|
| Gong | $250+/user/mo + $5K platform | Enterprise-only, no PBX integration, sales-focused |
| CallRail | $59-99/mo | Marketing attribution focused, limited AI analysis |
| CallMiner | Custom (enterprise) | Contact center only, no SMB play |
| CallCabinet | Custom | Enterprise pricing, complex onboarding |
| Fireflies.ai | $18-29/seat/mo | Meeting-focused, no PBX/phone system integration |
| Aircall | $30-50/user/mo | Replaces your phone system, doesn't integrate with existing PBX |

**AudiaPro's differentiator:** Works WITH existing phone systems (doesn't replace them), affordable flat rate + per-call pricing, AI analysis on every call automatically, beautiful dashboard purpose-built for call intelligence.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript strict |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| Storage | Supabase Storage (recordings + transcripts) |
| Validation | Zod |
| Transcription | Deepgram (Nova-2 model, speaker diarization) |
| AI Analysis | Anthropic Claude Sonnet via API |
| Email | Resend (transactional + analytics reports) |
| Testing | Vitest + Playwright |
| Frontend Hosting | Vercel |
| Background Worker | Render (single Node.js web service) |
| Monitoring | Sentry (error tracking) |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUDIAPRO SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────┐  │
│  │ Grandstream  │────▶│  Vercel API      │────▶│  Supabase  │  │
│  │ UCM Webhook  │     │  /api/webhook/   │     │  job_queue  │  │
│  │ (CDR data)   │     │  inbound         │     │  table     │  │
│  └──────────────┘     └──────────────────┘     └─────┬──────┘  │
│                                                       │         │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────▼──────┐  │
│  │ Other PBX    │────▶│  Vercel API      │────▶│  Render    │  │
│  │ Webhooks     │     │  /api/webhook/   │     │  Worker    │  │
│  │ (generic)    │     │  generic         │     │  (polls)   │  │
│  └──────────────┘     └──────────────────┘     └─────┬──────┘  │
│                                                       │         │
│                        Worker Pipeline:                │         │
│                        1. Auth with UCM API           │         │
│                        2. Download recording ──────────┤         │
│                        3. Upload to Supabase Storage   │         │
│                        4. Send to Deepgram ────────────┤         │
│                        5. Send transcript to Claude    │         │
│                        6. Store AI analysis            │         │
│                        7. Update CDR record            │         │
│                                                       │         │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────▼──────┐  │
│  │ Client Admin │────▶│  Vercel Frontend  │────▶│  Supabase  │  │
│  │ Dashboard    │     │  Next.js App      │     │  Database  │  │
│  └──────────────┘     └──────────────────┘     │  + Storage │  │
│                                                 └────────────┘  │
│  ┌──────────────┐     ┌──────────────────┐                      │
│  │ Super Admin  │────▶│  Vercel Frontend  │  (same app,         │
│  │ Back Office  │     │  /admin routes    │   role-gated)       │
│  └──────────────┘     └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gate 1: Roles & Permissions

### Role Definitions

#### Super Admin (BotMakers Staff)

The internal BotMakers team. Full system access. Manages all tenant accounts, connects PBX systems, controls billing, enables/disables accounts.

#### Client Admin (Customer)

The business owner or designated admin at a client org. Views all calls for their organization, accesses AI analytics, pulls reports, configures email notification preferences.

### Permission Matrix

| Resource | Super Admin | Client Admin |
|----------|:-----------:|:------------:|
| **Tenants** | | |
| Create tenant | ✅ | ❌ |
| Edit tenant settings | ✅ | ❌ |
| Enable/disable tenant | ✅ | ❌ |
| Delete tenant | ✅ | ❌ |
| View all tenants | ✅ | ❌ |
| **PBX Connections** | | |
| Create connection | ✅ | ❌ |
| Edit connection | ✅ | ❌ |
| Delete connection | ✅ | ❌ |
| Test connection | ✅ | ❌ |
| View connections | ✅ | Own tenant only |
| **Users** | | |
| Create super admin | ✅ | ❌ |
| Create client admin | ✅ | ❌ |
| Edit any user | ✅ | ❌ |
| Deactivate user | ✅ | ❌ |
| **Calls / CDR Records** | | |
| View call list | ✅ (all tenants) | ✅ (own tenant) |
| View call detail | ✅ (all tenants) | ✅ (own tenant) |
| Play recording | ✅ (all tenants) | ✅ (own tenant) |
| View transcript | ✅ (all tenants) | ✅ (own tenant) |
| View AI analysis | ✅ (all tenants) | ✅ (own tenant) |
| Export calls CSV | ✅ (all tenants) | ✅ (own tenant) |
| Delete calls | ✅ | ❌ |
| **Analytics Dashboard** | | |
| View system-wide analytics | ✅ | ❌ |
| View tenant analytics | ✅ (all tenants) | ✅ (own tenant) |
| **Reports** | | |
| Generate report | ✅ | ✅ (own tenant) |
| Schedule email reports | ✅ | ✅ (own tenant) |
| Export PDF report | ✅ | ✅ (own tenant) |
| **Billing** | | |
| View billing for all tenants | ✅ | ❌ |
| Update billing status | ✅ | ❌ |
| View own billing | ❌ | ✅ |
| **System Settings** | | |
| Manage webhook keys | ✅ | ❌ |
| View system health | ✅ | ❌ |
| View job queue | ✅ | ❌ |
| Manage custom keywords | ✅ (all tenants) | ✅ (own tenant) |

---

## Gate 2: Data Model

### Table: tenants

The top-level organization. Each client company is one tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL, company name |
| slug | text | UNIQUE, URL-safe identifier |
| status | enum | 'active', 'suspended', 'cancelled'. Default 'active' |
| billing_plan | text | Default 'standard' |
| monthly_rate_cents | integer | Default 34900 ($349.00) |
| per_call_rate_cents | integer | Default 10 ($0.10) |
| billing_email | text | NULL, email for billing notifications |
| notes | text | NULL, internal notes |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### Table: users

Authentication and role assignment.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, references auth.users(id) |
| tenant_id | uuid | FK → tenants(id), NULL for super admins |
| email | text | UNIQUE, NOT NULL |
| full_name | text | NOT NULL |
| role | enum | 'super_admin', 'client_admin' |
| is_active | boolean | DEFAULT true |
| last_login_at | timestamptz | NULL |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### Table: pbx_connections

Configuration for each PBX system connected to AudiaPro.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL |
| name | text | NOT NULL, display name (e.g., "Main Office Grandstream") |
| provider_type | enum | 'grandstream_ucm', 'freepbx', '3cx', 'generic_webhook' |
| host | text | NOT NULL, PBX host/IP (e.g., "071ffb.c.myucm.cloud") |
| port | integer | DEFAULT 8443 |
| api_username | text | encrypted at rest |
| api_password | text | encrypted at rest |
| webhook_secret | text | auto-generated, used to verify incoming webhooks |
| webhook_url | text | auto-generated, the URL the PBX sends CDR data to |
| is_active | boolean | DEFAULT true |
| last_connected_at | timestamptz | NULL |
| connection_status | enum | 'connected', 'disconnected', 'error'. Default 'disconnected' |
| config_json | jsonb | Provider-specific config (SSL verify, recording format, etc.) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### Table: cdr_records

Every call detail record received from a PBX.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL, indexed |
| pbx_connection_id | uuid | FK → pbx_connections(id), NOT NULL |
| session_id | text | UCM session ID (e.g., "1461920017104140-1000") |
| call_direction | enum | 'inbound', 'outbound', 'internal' |
| src | text | Source number/extension |
| dst | text | Destination number/extension |
| caller_name | text | NULL, caller ID name |
| clid | text | Full caller ID string |
| start_time | timestamptz | NOT NULL, call start |
| answer_time | timestamptz | NULL, when answered |
| end_time | timestamptz | NULL, call end |
| duration_seconds | integer | Total ring + talk time |
| billsec_seconds | integer | Actual talk time |
| disposition | enum | 'answered', 'no_answer', 'busy', 'failed', 'congestion' |
| action_type | text | UCM action type (DIAL, TRANSFER, CONFERENCE, etc.) |
| action_owner | text | Extension that initiated the action |
| src_trunk_name | text | NULL, source trunk |
| dst_trunk_name | text | NULL, destination trunk |
| recording_filename | text | NULL, original filename from PBX (e.g., "20260204-154532-1000-...wav") |
| recording_storage_path | text | NULL, path in Supabase Storage |
| recording_duration_ms | integer | NULL, recording length |
| recording_size_bytes | integer | NULL, file size |
| recording_downloaded | boolean | DEFAULT false |
| recording_downloaded_at | timestamptz | NULL |
| transcript_storage_path | text | NULL, path to transcript JSON in Storage |
| transcript_status | enum | 'pending', 'processing', 'completed', 'failed', 'skipped'. Default 'pending' |
| analysis_status | enum | 'pending', 'processing', 'completed', 'failed', 'skipped'. Default 'pending' |
| raw_webhook_payload | jsonb | Full original webhook data for debugging |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexes:** tenant_id, (tenant_id, start_time DESC), (tenant_id, disposition), session_id, pbx_connection_id

### Table: call_analyses

AI analysis results for each call. One-to-one with cdr_records (for answered calls with recordings).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| cdr_record_id | uuid | FK → cdr_records(id), UNIQUE, NOT NULL |
| tenant_id | uuid | FK → tenants(id), NOT NULL, indexed |
| summary | text | 2-3 sentence executive summary |
| sentiment_overall | enum | 'positive', 'negative', 'neutral', 'mixed' |
| sentiment_score | decimal(3,2) | -1.00 to 1.00 |
| sentiment_timeline | jsonb | Array of {timestamp_ms, sentiment, score} |
| talk_ratio | jsonb | {caller: 0.45, agent: 0.55} percentages |
| talk_time_seconds | jsonb | {caller: 120, agent: 150} |
| silence_seconds | integer | Total dead air / hold time |
| keywords | jsonb | Array of {keyword, count, context} |
| topics | jsonb | Array of {topic, relevance_score} |
| action_items | jsonb | Array of {description, assignee, deadline_mentioned} |
| call_disposition_ai | text | AI-classified: sale, support, complaint, inquiry, follow_up, scheduling, etc. |
| compliance_score | decimal(3,2) | 0.00 to 1.00 |
| compliance_flags | jsonb | Array of {flag, description, passed} |
| escalation_risk | enum | 'low', 'medium', 'high' |
| escalation_reasons | jsonb | NULL, array of reasons |
| satisfaction_prediction | enum | 'satisfied', 'neutral', 'dissatisfied' |
| satisfaction_score | decimal(3,2) | 0.00 to 1.00 |
| questions_asked | jsonb | Array of {speaker, question, timestamp_ms} |
| objections | jsonb | Array of {objection, response, outcome} |
| custom_keyword_matches | jsonb | Array of {keyword_id, keyword, count, contexts} |
| word_count | integer | Total words in transcript |
| words_per_minute | jsonb | {caller: 140, agent: 155} |
| model_used | text | e.g., "claude-sonnet-4-5-20250929" |
| processing_time_ms | integer | How long AI analysis took |
| created_at | timestamptz | DEFAULT now() |

**Indexes:** tenant_id, (tenant_id, created_at DESC), cdr_record_id

### Table: custom_keywords

Client-defined keywords to track across their calls.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL |
| keyword | text | NOT NULL, the word or phrase |
| category | text | NULL, grouping (e.g., "competitor", "product", "complaint") |
| is_active | boolean | DEFAULT true |
| created_at | timestamptz | DEFAULT now() |

**Unique constraint:** (tenant_id, keyword)

### Table: job_queue

Background processing queue for the Render worker.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL |
| cdr_record_id | uuid | FK → cdr_records(id), NOT NULL |
| job_type | enum | 'download_recording', 'transcribe', 'analyze', 'full_pipeline' |
| status | enum | 'pending', 'processing', 'completed', 'failed', 'retry' |
| priority | integer | DEFAULT 0, higher = more urgent |
| attempts | integer | DEFAULT 0 |
| max_attempts | integer | DEFAULT 3 |
| error_message | text | NULL, last error |
| started_at | timestamptz | NULL |
| completed_at | timestamptz | NULL |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexes:** (status, priority DESC, created_at ASC), tenant_id

### Table: email_reports

Scheduled email analytics report preferences.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL |
| user_id | uuid | FK → users(id), NOT NULL |
| report_type | enum | 'daily_summary', 'weekly_summary', 'monthly_summary' |
| is_active | boolean | DEFAULT true |
| last_sent_at | timestamptz | NULL |
| next_send_at | timestamptz | NULL |
| config_json | jsonb | Report preferences (metrics to include, etc.) |
| created_at | timestamptz | DEFAULT now() |

### Table: billing_events

Tracks call counts and billing events per tenant per month.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| tenant_id | uuid | FK → tenants(id), NOT NULL |
| billing_month | date | First day of billing month (e.g., 2026-02-01) |
| call_count | integer | DEFAULT 0, total calls processed |
| monthly_charge_cents | integer | Flat monthly rate |
| per_call_charge_cents | integer | call_count × per_call_rate |
| total_charge_cents | integer | monthly + per_call |
| status | enum | 'open', 'invoiced', 'paid', 'overdue' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Unique constraint:** (tenant_id, billing_month)

### Supabase Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| recordings | Private (signed URLs) | Call recording WAV/MP3 files. Path: `{tenant_id}/{YYYY-MM}/{recording_filename}` |
| transcripts | Private (signed URLs) | Transcript JSON files. Path: `{tenant_id}/{YYYY-MM}/{cdr_record_id}.json` |
| exports | Private (signed URLs) | Generated CSV/PDF reports. Path: `{tenant_id}/exports/{filename}` |

### Row-Level Security (RLS) Policies

All tables enforce tenant isolation via RLS:

- **Super Admin:** Full access to all rows in all tables
- **Client Admin:** Can only SELECT rows where `tenant_id` matches their `users.tenant_id`
- **Service role** (worker): Bypasses RLS for background processing
- **Webhook endpoints:** Use service role key for inserts

---

## Gate 3: Pages & Navigation

### Public Pages

| Page | Path | Purpose |
|------|------|---------|
| Landing Page | / | Marketing site, features, pricing, CTA |
| Login | /login | Email + password auth via Supabase |
| Forgot Password | /forgot-password | Password reset flow |
| Reset Password | /reset-password | Set new password from email link |

### Client Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | /dashboard | Overview analytics — call volume, sentiment trends, top keywords, heatmaps |
| Calls List | /dashboard/calls | Paginated list of all calls with search, filter, sort |
| Call Detail | /dashboard/calls/[id] | Full call detail — recording player, transcript, AI analysis, sentiment timeline |
| Reports | /dashboard/reports | Generate and download CSV/PDF reports |
| Settings | /dashboard/settings | Email report preferences, custom keywords, profile |
| Billing | /dashboard/billing | View current month usage and billing history |

### Super Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| Admin Dashboard | /admin | System overview — total tenants, calls today, job queue health, errors |
| Tenants List | /admin/tenants | All client accounts with status, call counts, billing |
| Tenant Detail | /admin/tenants/[id] | Edit tenant, manage PBX connections, view billing, enable/disable |
| Create Tenant | /admin/tenants/new | New client account setup wizard |
| PBX Connections | /admin/connections | All PBX connections across tenants, connection status |
| Connection Detail | /admin/connections/[id] | Edit connection, test connection, view webhook URL + secret |
| Users | /admin/users | All users across system |
| Create User | /admin/users/new | Add super admin or client admin |
| Job Queue | /admin/jobs | View processing queue, retry failed jobs, job stats |
| System Health | /admin/health | Worker status, API latencies, storage usage |
| Billing Overview | /admin/billing | All tenants billing, monthly totals, overdue accounts |
| All Calls | /admin/calls | View calls across all tenants (for debugging/support) |

### API Routes (Webhook Endpoints)

| Route | Method | Purpose |
|-------|--------|---------|
| /api/webhook/grandstream/[connection_id] | POST | Receives CDR Real-Time Output from Grandstream UCM |
| /api/webhook/generic/[connection_id] | POST | Receives webhook from any PBX with standard format |

### Error Pages

| Page | Path | Purpose |
|------|------|---------|
| 404 | /404 | Custom not found page with navigation |
| 500 | /500 | Custom error page with support contact |
| Unauthorized | /unauthorized | Access denied with role explanation |
| Account Suspended | /suspended | Shown when tenant status is 'suspended' |

---

## Gate 4: API Routes & Integrations

### Webhook Inbound Routes

#### POST /api/webhook/grandstream/[connection_id]

Receives CDR Real-Time Output from Grandstream UCM systems.

**Auth:** Validates `webhook_secret` from query param or header.

**Expected payload (JSON):**
```json
{
  "accountcode": "",
  "src": "1000",
  "dst": "2815058290",
  "dcontext": "from-internal",
  "clid": "\"John Doe\" <1000>",
  "channel": "PJSIP/1000-00000003",
  "dstchannel": "PJSIP/trunk_1-00000004",
  "lastapp": "Dial",
  "start": "2026-02-14 10:30:00",
  "answer": "2026-02-14 10:30:05",
  "end": "2026-02-14 10:35:22",
  "duration": "322",
  "billsec": "317",
  "disposition": "ANSWERED",
  "uniqueid": "1707900600.1234",
  "caller_name": "John Doe",
  "recordfiles": "20260214-103000-1000-2815058290-1707900600.85.wav",
  "session": "1707900600104140-1000",
  "action_owner": "1000",
  "action_type": "DIAL",
  "src_trunk_name": "",
  "dst_trunk_name": "main_trunk"
}
```

**Processing:**
1. Validate webhook_secret
2. Look up pbx_connection by connection_id, verify is_active and tenant is active
3. Parse CDR fields, determine call_direction from dcontext/trunk info
4. Insert cdr_records row
5. If disposition is ANSWERED and recordfiles is not empty, create job_queue entry with job_type 'full_pipeline'
6. Return 200 OK immediately (processing is async)

**Error codes:** CB-API-001 (invalid webhook secret), CB-API-002 (connection not found), CB-API-003 (tenant suspended), CB-API-004 (payload validation failed)

#### POST /api/webhook/generic/[connection_id]

Generic webhook for non-Grandstream PBX systems.

**Expected payload:**
```json
{
  "call_id": "string",
  "direction": "inbound|outbound|internal",
  "from": "string",
  "to": "string",
  "caller_name": "string",
  "start_time": "ISO 8601",
  "end_time": "ISO 8601",
  "duration": 322,
  "status": "answered|missed|busy|failed",
  "recording_url": "string (optional)",
  "recording_filename": "string (optional)"
}
```

### Internal API Routes (Vercel API Routes)

All authenticated via Supabase Auth session.

#### Tenants

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/tenants | Super Admin | List all tenants |
| POST | /api/tenants | Super Admin | Create tenant |
| GET | /api/tenants/[id] | Super Admin | Get tenant detail |
| PATCH | /api/tenants/[id] | Super Admin | Update tenant |
| POST | /api/tenants/[id]/toggle-status | Super Admin | Enable/disable tenant |
| DELETE | /api/tenants/[id] | Super Admin | Soft delete tenant |

#### PBX Connections

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/connections | Super Admin | List all connections |
| POST | /api/connections | Super Admin | Create connection (auto-generates webhook URL + secret) |
| GET | /api/connections/[id] | Super Admin | Get connection detail |
| PATCH | /api/connections/[id] | Super Admin | Update connection |
| POST | /api/connections/[id]/test | Super Admin | Test PBX API connection (challenge → login → verify) |
| DELETE | /api/connections/[id] | Super Admin | Delete connection |

#### Calls (CDR Records)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/calls | Both | List calls (paginated, filtered, sorted). Client Admin auto-filtered to own tenant |
| GET | /api/calls/[id] | Both | Get full call detail including analysis |
| GET | /api/calls/[id]/recording-url | Both | Generate signed URL for recording playback (expires in 1 hour) |
| GET | /api/calls/[id]/transcript | Both | Get transcript JSON |
| POST | /api/calls/[id]/reprocess | Super Admin | Re-run AI analysis on a call |
| DELETE | /api/calls/[id] | Super Admin | Delete call and associated files |

#### Analytics

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/analytics/overview | Both | Dashboard stats (call volume, avg duration, sentiment distribution) |
| GET | /api/analytics/trends | Both | Time-series data for charts (configurable date range + metric) |
| GET | /api/analytics/keywords | Both | Top keywords over time period |
| GET | /api/analytics/heatmap | Both | Call volume heatmap by hour/day |
| GET | /api/analytics/agents | Both | Per-extension performance metrics |

#### Reports & Exports

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /api/reports/export-csv | Both | Generate CSV export of filtered calls |
| POST | /api/reports/export-pdf | Both | Generate PDF analytics report |
| GET | /api/reports/email-preferences | Both | Get email report settings |
| POST | /api/reports/email-preferences | Both | Save email report settings |

#### Users

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/users | Super Admin | List all users |
| POST | /api/users | Super Admin | Create user (sends invite email) |
| PATCH | /api/users/[id] | Super Admin | Update user |
| POST | /api/users/[id]/toggle-active | Super Admin | Enable/disable user |

#### Billing

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/billing | Super Admin | All tenants billing overview |
| GET | /api/billing/[tenant_id] | Both | Tenant billing detail + history |
| PATCH | /api/billing/[tenant_id]/[month] | Super Admin | Update billing status (mark paid, etc.) |

#### System (Super Admin Only)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/system/health | Super Admin | Worker status, queue depth, error rates |
| GET | /api/system/jobs | Super Admin | Job queue list with filters |
| POST | /api/system/jobs/[id]/retry | Super Admin | Retry failed job |
| POST | /api/system/jobs/bulk-retry | Super Admin | Retry all failed jobs |

### External Integrations

#### Grandstream UCM API

**Authentication flow (per connection):**
1. GET `https://{host}:{port}/api/challenge` → receive challenge token
2. MD5 hash: `md5(challenge + password)`
3. POST `https://{host}:{port}/api/login` with username + hashed password → receive session cookie
4. Use session cookie for subsequent requests

**Recording download:**
- GET `https://{host}:{port}/api/recapi?recording_file={filename}` with session cookie
- Returns WAV file binary

**CDR query (backup/historical):**
- GET `https://{host}:{port}/api/cdrapi` with session cookie
- Returns CDR records in JSON/CSV/XML

**Error codes:** CB-INT-001 (UCM auth failed), CB-INT-002 (recording not found), CB-INT-003 (session expired), CB-INT-004 (UCM unreachable)

#### Deepgram API

**Endpoint:** POST `https://api.deepgram.com/v1/listen`

**Config:**
```json
{
  "model": "nova-2",
  "language": "en",
  "smart_format": true,
  "diarize": true,
  "punctuate": true,
  "paragraphs": true,
  "utterances": true,
  "detect_language": true
}
```

**Input:** WAV file binary uploaded directly
**Output:** JSON with words, speakers, timestamps, paragraphs, utterances

**Error codes:** CB-INT-010 (Deepgram auth failed), CB-INT-011 (transcription failed), CB-INT-012 (unsupported audio format)

#### Anthropic Claude API

**Endpoint:** POST `https://api.anthropic.com/v1/messages`

**Model:** claude-sonnet-4-5-20250929

**System prompt:** Structured analysis prompt that outputs JSON with all analysis fields (summary, sentiment, keywords, etc.)

**Input:** Full transcript with speaker labels + tenant's custom keywords list
**Output:** Structured JSON matching call_analyses table schema

**Error codes:** CB-INT-020 (Claude API auth failed), CB-INT-021 (analysis failed), CB-INT-022 (response parse error)

#### Resend Email API

**Purposes:**
- Welcome email on user creation
- Password reset emails (via Supabase Auth)
- Scheduled analytics report emails (daily/weekly/monthly)
- Account suspended notification
- Account reactivated notification

**Error codes:** CB-EMAIL-001 (send failed), CB-EMAIL-002 (template error), CB-EMAIL-003 (invalid recipient)

---

## Gate 5: Workflows, Automation & AI

### Primary Workflow: Call Processing Pipeline

This is the core workflow that runs for every completed call.

```
TRIGGER: Grandstream UCM sends CDR webhook on call completion
    │
    ▼
STEP 1: Webhook Received (Vercel API, < 1 second)
    ├── Validate webhook secret
    ├── Parse CDR payload
    ├── Determine call direction (inbound/outbound/internal)
    ├── Insert cdr_records row
    ├── If ANSWERED + has recording → create job_queue entry (type: full_pipeline)
    ├── If NOT ANSWERED → mark transcript_status and analysis_status as 'skipped'
    └── Return 200 OK
    │
    ▼
STEP 2: Worker Picks Up Job (Render worker, polls every 5 seconds)
    ├── Query job_queue for oldest pending job
    ├── Set status to 'processing', increment attempts
    └── Begin pipeline
    │
    ▼
STEP 3: Download Recording (10-60 seconds depending on file size)
    ├── Load pbx_connection credentials (decrypted)
    ├── Authenticate with UCM: challenge → MD5 hash → login → session cookie
    ├── Download recording via RECAPI: GET /api/recapi?recording_file={filename}
    ├── If download fails, check if SSL verification needs to be disabled
    ├── Upload WAV to Supabase Storage: recordings/{tenant_id}/{YYYY-MM}/{filename}
    ├── Update cdr_records: recording_storage_path, recording_downloaded = true, size, duration
    └── On failure: retry up to 3 times with exponential backoff
    │
    ▼
STEP 4: Transcribe (15-90 seconds depending on call length)
    ├── Download recording from Supabase Storage (or use buffer from step 3)
    ├── Send to Deepgram Nova-2 with diarization enabled
    ├── Receive transcript with speaker labels, timestamps, words
    ├── Format transcript JSON: {speakers: [...], utterances: [...], words: [...], paragraphs: [...]}
    ├── Upload transcript JSON to Supabase Storage: transcripts/{tenant_id}/{YYYY-MM}/{cdr_id}.json
    ├── Update cdr_records: transcript_storage_path, transcript_status = 'completed'
    └── On failure: retry up to 3 times
    │
    ▼
STEP 5: AI Analysis (5-15 seconds)
    ├── Load transcript text with speaker labels
    ├── Load tenant's custom keywords (if any)
    ├── Send to Claude Sonnet with structured analysis prompt
    ├── Parse Claude's JSON response
    ├── Insert call_analyses row with all analysis fields
    ├── Update cdr_records: analysis_status = 'completed'
    └── On failure: retry up to 3 times
    │
    ▼
STEP 6: Finalize
    ├── Update job_queue: status = 'completed', completed_at = now()
    ├── Increment billing_events.call_count for this tenant/month
    └── Log processing metrics (total time, per-step times)
```

### Automation: Tenant Account Management

**Account Suspension (non-payment):**
1. Super Admin clicks "Suspend" on tenant
2. Set tenant.status = 'suspended'
3. Send suspension email to tenant's billing_email and all client_admin users
4. All webhook endpoints for this tenant start returning 403
5. Client Admin login redirects to /suspended page
6. No new calls processed, but existing data preserved

**Account Reactivation:**
1. Super Admin clicks "Reactivate" on tenant
2. Set tenant.status = 'active'
3. Send reactivation email
4. Webhooks resume accepting calls
5. Client Admin can log in again
6. Any calls that came in during suspension and were cached by UCM (up to 10,000) will be delivered

### Automation: Email Analytics Reports

**Scheduled reports (cron-style, run by Render worker):**

1. Worker checks email_reports table every hour for next_send_at <= now()
2. For each due report:
   - Query analytics for the report period (daily/weekly/monthly)
   - Generate HTML email with key metrics: call volume, avg sentiment, top keywords, notable calls
   - Send via Resend
   - Update last_sent_at and calculate next_send_at
3. Email includes: total calls, average duration, sentiment distribution, top 5 keywords, top 3 highest/lowest sentiment calls with summaries

### Automation: Billing Tracking

1. Every time a call is processed (job completed), increment billing_events.call_count
2. At month-end (or on-demand), Super Admin can view total charges per tenant
3. Total = monthly_rate_cents + (call_count × per_call_rate_cents)
4. Super Admin manually marks invoices as paid/overdue (manual billing for now)
5. If overdue > 30 days, system shows warning in admin dashboard

### AI: Call Analysis Prompt Structure

The Claude Sonnet prompt for each call analysis:

```
You are an expert call analyst for AudiaPro. Analyze the following phone call transcript 
and return a structured JSON analysis.

TRANSCRIPT:
{transcript with speaker labels and timestamps}

CUSTOM KEYWORDS TO TRACK:
{tenant's custom keyword list, if any}

CALL METADATA:
- Direction: {inbound/outbound}
- Duration: {seconds}
- Caller: {src}
- Destination: {dst}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of the call",
  "sentiment_overall": "positive|negative|neutral|mixed",
  "sentiment_score": float between -1.0 and 1.0,
  "sentiment_timeline": [{"timestamp_ms": int, "sentiment": "string", "score": float}],
  "talk_ratio": {"caller": float, "agent": float},
  "talk_time_seconds": {"caller": int, "agent": int},
  "silence_seconds": int,
  "keywords": [{"keyword": "string", "count": int, "context": "string"}],
  "topics": [{"topic": "string", "relevance_score": float}],
  "action_items": [{"description": "string", "assignee": "caller|agent", "deadline_mentioned": "string|null"}],
  "call_disposition_ai": "sale|support|complaint|inquiry|follow_up|scheduling|info_request|escalation|other",
  "compliance_score": float between 0.0 and 1.0,
  "compliance_flags": [{"flag": "string", "description": "string", "passed": boolean}],
  "escalation_risk": "low|medium|high",
  "escalation_reasons": ["string"] or null,
  "satisfaction_prediction": "satisfied|neutral|dissatisfied",
  "satisfaction_score": float between 0.0 and 1.0,
  "questions_asked": [{"speaker": "caller|agent", "question": "string", "timestamp_ms": int}],
  "objections": [{"objection": "string", "response": "string", "outcome": "resolved|unresolved|partial"}],
  "custom_keyword_matches": [{"keyword": "string", "count": int, "contexts": ["string"]}]
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Webhook response time | < 500ms |
| Full pipeline (download → transcribe → analyze) | < 3 minutes for a 10-minute call |
| Dashboard page load | < 2 seconds |
| Call list pagination | < 500ms per page |
| Lighthouse score | > 90 (Performance, Accessibility, Best Practices, SEO) |
| Recording playback start | < 3 seconds (signed URL) |

### Security Hardening

| Measure | Implementation |
|---------|---------------|
| Webhook auth | Per-connection secret validated on every request |
| PBX credentials | Encrypted at rest in database (pgcrypto or app-level AES-256) |
| Storage access | All files private, accessed only via signed URLs (1-hour expiry) |
| RLS | All tables enforce tenant isolation |
| Auth | Supabase Auth with email+password, session-based |
| CORS | Strict origin whitelist (audiapro.com only) |
| Rate limiting | Webhook endpoints: 100/min per connection. API: 60/min per user |
| Input validation | Zod schemas on all API inputs |
| XSS prevention | React auto-escaping + CSP headers |
| HTTPS only | Enforced on Vercel + Render |
| Worker auth | Supabase service role key, stored as Render env var |

### Accessibility (WCAG AA)

- All interactive elements keyboard navigable
- ARIA labels on all buttons, forms, data tables
- Color contrast ratios ≥ 4.5:1 for text, ≥ 3:1 for large text
- Focus indicators visible on all interactive elements
- Screen reader compatible call list and detail pages
- Audio player with keyboard controls
- Alt text on all images and charts
- Skip navigation links

### SEO (Public Pages Only)

- Meta title, description, Open Graph tags on landing page
- Structured data (Organization, SoftwareApplication)
- Sitemap.xml + robots.txt
- Canonical URLs
- Semantic HTML throughout

### User Onboarding Flow

**Client Admin (invited by Super Admin):**
1. Receives welcome email with temporary password link
2. Sets password, logs in
3. Sees onboarding modal: "Welcome to AudiaPro! Your account has been set up with {connection_count} phone system(s) connected. Calls are being recorded and analyzed automatically."
4. Quick tour highlights: Dashboard → Calls List → Call Detail → Reports → Settings
5. Dismissed after completion, won't show again

**Super Admin (new tenant setup):**
1. Create tenant → Add PBX connection → Test connection → Create client admin user → Send invite
2. Wizard-style flow with progress indicator

### Branded Emails

All emails use AudiaPro branding:
- From: AudiaPro <notifications@audiapro.com>
- Reply-to: support@audiapro.com
- Header: AudiaPro logo
- Footer: BotMakers Inc. | audiapro.com | Unsubscribe link (for reports)
- Templates: Welcome, Password Reset, Account Suspended, Account Reactivated, Daily/Weekly/Monthly Report

### Data Export

- **CSV Export:** All calls with selected fields, filtered by date range, disposition, sentiment
- **PDF Report:** Analytics summary with charts rendered server-side
- **Transcript Export:** Individual call transcript as TXT or JSON
- **Bulk Export:** All data for a tenant (GDPR compliance ready)

### Environment Variables (.env.example)

```bash
# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ===== Deepgram =====
DEEPGRAM_API_KEY=dg_...

# ===== Anthropic (Claude) =====
ANTHROPIC_API_KEY=sk-ant-...

# ===== Resend (Email) =====
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@audiapro.com

# ===== App Config =====
NEXT_PUBLIC_APP_URL=https://audiapro.com
NEXT_PUBLIC_APP_NAME=AudiaPro

# ===== Worker Config (Render) =====
WORKER_POLL_INTERVAL_MS=5000
WORKER_MAX_CONCURRENT_JOBS=3
WORKER_JOB_TIMEOUT_MS=300000

# ===== Encryption =====
ENCRYPTION_KEY=... (32-byte hex for PBX credential encryption)

# ===== Sentry =====
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# ===== Vercel =====
VERCEL_URL=https://audiapro.com
```

### Error Code Reference

| Code | Category | Description |
|------|----------|-------------|
| CB-AUTH-001 | Auth | Invalid credentials |
| CB-AUTH-002 | Auth | Session expired |
| CB-AUTH-003 | Auth | Insufficient permissions |
| CB-AUTH-004 | Auth | Account suspended |
| CB-DB-001 | Database | Connection failed |
| CB-DB-002 | Database | Query timeout |
| CB-DB-003 | Database | RLS violation |
| CB-DB-004 | Database | Unique constraint violation |
| CB-API-001 | API | Invalid webhook secret |
| CB-API-002 | API | Connection not found |
| CB-API-003 | API | Tenant suspended |
| CB-API-004 | API | Payload validation failed |
| CB-API-005 | API | Rate limit exceeded |
| CB-INT-001 | Integration | UCM auth failed |
| CB-INT-002 | Integration | Recording not found on UCM |
| CB-INT-003 | Integration | UCM session expired |
| CB-INT-004 | Integration | UCM unreachable |
| CB-INT-010 | Integration | Deepgram auth failed |
| CB-INT-011 | Integration | Transcription failed |
| CB-INT-012 | Integration | Unsupported audio format |
| CB-INT-020 | Integration | Claude API auth failed |
| CB-INT-021 | Integration | AI analysis failed |
| CB-INT-022 | Integration | AI response parse error |
| CB-UI-001 | UI | Component render error |
| CB-UI-002 | UI | Form validation error |
| CB-CRON-001 | Cron | Email report generation failed |
| CB-CRON-002 | Cron | Billing calculation failed |
| CB-EMAIL-001 | Email | Send failed |
| CB-EMAIL-002 | Email | Template error |
| CB-EMAIL-003 | Email | Invalid recipient |
| CB-SMS-001 | SMS | Reserved for future use |
