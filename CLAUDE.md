# CLAUDE.md — AudiaPro Build Instructions

> This file provides Claude Code with the rules, conventions, and context needed to build AudiaPro.

---

## Project Identity

- **Name:** AudiaPro
- **Domain:** audiapro.com
- **Description:** AI-Powered Call Recording & Analytics SaaS
- **Owner:** BotMakers Inc.

---

## Tech Stack (Do Not Deviate)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | strict mode |
| Database | Supabase PostgreSQL | latest |
| ORM | Drizzle ORM | latest |
| Auth | Supabase Auth | latest |
| Storage | Supabase Storage | latest |
| UI | shadcn/ui + Tailwind CSS | latest |
| Validation | Zod | latest |
| Testing | Vitest (unit) + Playwright (e2e) | latest |
| Email | Resend | latest |
| Transcription | Deepgram SDK | latest |
| AI Analysis | Anthropic SDK | latest |
| Error Tracking | Sentry | latest |
| Frontend Deploy | Vercel | - |
| Worker Deploy | Render | Node.js |

---

## Project Structure

```
audiapro/
├── .env.example
├── .env.local                    # Local dev (gitignored)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── package.json
├── vitest.config.ts
├── playwright.config.ts
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page (public)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── suspended/
│   │   │   └── page.tsx
│   │   │
│   │   ├── dashboard/            # Client Admin pages
│   │   │   ├── layout.tsx        # Dashboard shell (sidebar, header)
│   │   │   ├── page.tsx          # Overview analytics
│   │   │   ├── calls/
│   │   │   │   ├── page.tsx      # Paginated call list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Call detail + AI analysis
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── billing/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                # Super Admin pages
│   │   │   ├── layout.tsx        # Admin shell
│   │   │   ├── page.tsx          # System overview
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── connections/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── jobs/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   ├── calls/
│   │   │   │   └── page.tsx
│   │   │   └── health/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── webhook/
│   │   │   │   ├── grandstream/
│   │   │   │   │   └── [connectionId]/
│   │   │   │   │       └── route.ts
│   │   │   │   └── generic/
│   │   │   │       └── [connectionId]/
│   │   │   │           └── route.ts
│   │   │   ├── tenants/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── connections/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── calls/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── analytics/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── reports/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── users/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── billing/
│   │   │   │   └── [...]/route.ts
│   │   │   └── system/
│   │   │       └── [...]/route.ts
│   │   │
│   │   ├── not-found.tsx         # 404 page
│   │   └── error.tsx             # 500 page
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── call-volume-chart.tsx
│   │   │   ├── sentiment-trend.tsx
│   │   │   ├── keyword-cloud.tsx
│   │   │   └── heatmap.tsx
│   │   ├── calls/
│   │   │   ├── call-list.tsx
│   │   │   ├── call-list-filters.tsx
│   │   │   ├── call-row.tsx
│   │   │   ├── call-detail.tsx
│   │   │   ├── recording-player.tsx
│   │   │   ├── transcript-viewer.tsx
│   │   │   ├── sentiment-timeline.tsx
│   │   │   ├── analysis-cards.tsx
│   │   │   └── talk-ratio-chart.tsx
│   │   ├── admin/
│   │   │   ├── tenant-form.tsx
│   │   │   ├── connection-form.tsx
│   │   │   ├── connection-test.tsx
│   │   │   ├── user-form.tsx
│   │   │   └── job-queue-table.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── pagination.tsx
│   │       ├── date-range-picker.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-boundary.tsx
│   │       └── onboarding-modal.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   ├── admin.ts          # Service role client (worker)
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema (all tables)
│   │   │   ├── migrations/       # Drizzle migrations
│   │   │   └── queries/          # Reusable query functions
│   │   │       ├── tenants.ts
│   │   │       ├── calls.ts
│   │   │       ├── analytics.ts
│   │   │       ├── connections.ts
│   │   │       ├── users.ts
│   │   │       └── billing.ts
│   │   ├── validations/          # Zod schemas
│   │   │   ├── webhook.ts
│   │   │   ├── tenant.ts
│   │   │   ├── connection.ts
│   │   │   ├── call.ts
│   │   │   └── user.ts
│   │   ├── integrations/
│   │   │   ├── grandstream.ts    # UCM API client (auth, download recording, CDR query)
│   │   │   ├── deepgram.ts       # Transcription client
│   │   │   ├── claude.ts         # AI analysis client + prompt
│   │   │   └── resend.ts         # Email client + templates
│   │   ├── encryption.ts         # AES-256 encrypt/decrypt for PBX credentials
│   │   ├── errors.ts             # CodeBakers error code system
│   │   ├── constants.ts          # App-wide constants
│   │   └── utils.ts              # Shared utilities
│   │
│   ├── hooks/                    # React hooks
│   │   ├── use-auth.ts
│   │   ├── use-tenant.ts
│   │   ├── use-calls.ts
│   │   └── use-analytics.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── database.ts           # Generated from Drizzle schema
│   │   ├── api.ts                # API request/response types
│   │   ├── webhook.ts            # Webhook payload types
│   │   └── analysis.ts           # AI analysis result types
│   │
│   └── middleware.ts             # Next.js middleware (auth + role routing)
│
├── worker/                       # Render background worker (separate deploy)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Worker entry point (poll loop + health endpoint)
│   │   ├── pipeline.ts           # Full call processing pipeline
│   │   ├── steps/
│   │   │   ├── download.ts       # Download recording from PBX
│   │   │   ├── transcribe.ts     # Send to Deepgram
│   │   │   ├── analyze.ts        # Send to Claude
│   │   │   └── finalize.ts       # Update records, billing
│   │   ├── lib/
│   │   │   ├── supabase.ts       # Service role client
│   │   │   ├── grandstream.ts    # UCM API client (shared with main app)
│   │   │   ├── deepgram.ts       # Deepgram client
│   │   │   ├── claude.ts         # Claude client + analysis prompt
│   │   │   ├── encryption.ts     # Decrypt PBX credentials
│   │   │   └── resend.ts         # Email for scheduled reports
│   │   ├── cron/
│   │   │   ├── email-reports.ts  # Scheduled analytics emails
│   │   │   └── billing.ts       # Monthly billing calculations
│   │   └── health.ts             # Health check endpoint for Render
│   └── Dockerfile                # Optional, Render can use Node buildpack
│
├── supabase/
│   ├── config.toml
│   └── migrations/               # SQL migrations
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_storage_buckets.sql
│       └── 004_indexes.sql
│
└── tests/
    ├── unit/
    │   ├── webhook.test.ts
    │   ├── grandstream.test.ts
    │   ├── pipeline.test.ts
    │   └── analytics.test.ts
    └── e2e/
        ├── auth.spec.ts
        ├── dashboard.spec.ts
        ├── calls.spec.ts
        └── admin.spec.ts
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `call-detail.tsx` |
| Components | PascalCase | `CallDetail` |
| Functions | camelCase | `getCallById` |
| Types/Interfaces | PascalCase | `CdrRecord`, `CallAnalysis` |
| Database tables | snake_case | `cdr_records`, `call_analyses` |
| Database columns | snake_case | `tenant_id`, `recording_filename` |
| API routes | kebab-case | `/api/calls/[id]/recording-url` |
| Env vars | SCREAMING_SNAKE | `DEEPGRAM_API_KEY` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |
| Error codes | CB-CATEGORY-NNN | `CB-INT-001` |

---

## Coding Rules

### General
- TypeScript strict mode, no `any` types, no `@ts-ignore`
- All API inputs validated with Zod before processing
- All database queries use Drizzle ORM, no raw SQL except in migrations
- All errors use CodeBakers error code system (CB-XXX-NNN)
- All async operations wrapped in try/catch with proper error logging
- No console.log in production code — use Sentry or structured logging

### API Routes
- Every route must check auth via Supabase session
- Every route must check role permissions
- Every route that returns tenant-scoped data must filter by tenant_id
- Webhook routes validate secret before processing
- All responses use consistent JSON structure: `{ data, error, meta }`
- Paginated responses include: `{ data: [], meta: { total, page, pageSize, totalPages } }`

### Database
- All tables have `id` (uuid), `created_at` (timestamptz)
- Mutable tables also have `updated_at` (timestamptz)
- All foreign keys have ON DELETE CASCADE or SET NULL (specified in schema)
- RLS enabled on ALL tables — no exceptions
- Indexes on all foreign keys and commonly filtered columns

### Components
- Use shadcn/ui components as base, customize with Tailwind
- Every page has a loading skeleton (Suspense boundary)
- Every page has an error boundary
- Data tables use the shared DataTable component with sorting, filtering, pagination
- Forms use react-hook-form + Zod resolver
- All interactive elements have ARIA labels

### Worker
- Worker runs as a standalone Node.js process (not Next.js)
- Polls job_queue table every 5 seconds
- Processes max 3 concurrent jobs
- Each job step has its own retry logic (3 attempts with exponential backoff)
- Worker exposes /health endpoint for Render health checks
- Worker logs to Sentry + stdout for Render log viewer

### Security
- PBX credentials encrypted with AES-256-GCM before storage
- ENCRYPTION_KEY stored only in env vars, never in code
- All file access via signed URLs (1-hour expiry)
- Webhook secrets are 32-byte random hex strings
- No sensitive data in URL query parameters
- CSP headers on all pages
- CORS restricted to audiapro.com

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #FF7F50 | Coral — primary buttons, active states, accents |
| Primary Dark | #E86840 | Hover states |
| Background | #0F1117 | Dark mode main background |
| Surface | #1A1D27 | Cards, panels |
| Surface Hover | #242736 | Hover on surface elements |
| Border | #2E3142 | Dividers, card borders |
| Text Primary | #F5F5F7 | Main text |
| Text Secondary | #9CA3AF | Muted text, labels |
| Success | #22C55E | Positive sentiment, completed status |
| Warning | #F59E0B | Medium risk, pending status |
| Error | #EF4444 | Negative sentiment, failed status, errors |
| Info | #3B82F6 | Informational badges |

### Typography

- Font: Inter (Google Fonts)
- Headings: Bold, tracking-tight
- Body: Regular, 16px base
- Mono: JetBrains Mono (for transcripts, technical data)

### Layout

- Dark mode by default (call analytics tools are typically used in dark environments)
- Sidebar navigation (collapsible)
- Mobile-first responsive
- Max content width: 1280px
- Card-based layout with rounded corners (rounded-xl)
- Mesh gradient accents on hero sections

---

## Build Order

Follow BUILD-STAGES.md exactly. Each stage builds on the previous. Do not skip stages.
Do not attempt to build everything at once. Each stage should be completed, tested, and verified before moving to the next.
