# AudiaPro - AI-Powered Call Recording & Analytics

> Transform every customer conversation into actionable insights with AI-powered call analytics.

**AudiaPro** is a comprehensive SaaS platform that automatically transcribes, analyzes, and extracts valuable insights from phone calls using advanced AI technology. Built for sales teams, support organizations, and compliance-focused businesses.

---

## Features

- **Real-time Transcription** - Accurate speech-to-text with speaker identification and timestamps
- **AI Sentiment Analysis** - Understand customer emotions and satisfaction automatically
- **Keyword Tracking** - Track specific keywords and topics across all conversations
- **Compliance Monitoring** - Ensure regulatory compliance with automated script adherence checks
- **Automated Reports** - Daily, weekly, or monthly analytics reports via email
- **Seamless Integration** - Works with Grandstream UCM, FreePBX, 3CX, and any webhook-enabled PBX

---

## Tech Stack

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
| Charts | Recharts | latest |
| PDF Generation | pdfkit | latest |
| Transcription | Deepgram SDK | latest |
| AI Analysis | OpenAI SDK | latest |
| Email | Resend | latest |
| Error Tracking | Sentry | latest |
| Frontend Deploy | Vercel | - |
| Worker Deploy | Render | Node.js |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account
- Deepgram API key
- OpenAI API key
- Resend API key (for emails)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-org/audiapro.git
cd audiapro
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# AI Services
DEEPGRAM_API_KEY=dg_your_api_key
OPENAI_API_KEY=sk-proj-your_api_key

# Email
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=notifications@audiapro.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_byte_hex_string

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

4. **Set up the database**

Run the database migrations:

```bash
npm run db:push
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
audiapro/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── login/                # Authentication pages
│   │   ├── dashboard/            # Client dashboard
│   │   │   ├── page.tsx          # Analytics overview
│   │   │   ├── calls/            # Call list and details
│   │   │   ├── reports/          # Reports page
│   │   │   ├── settings/         # Settings page
│   │   │   └── billing/          # Billing page
│   │   ├── admin/                # Super admin pages
│   │   └── api/                  # API routes
│   │       ├── dashboard/        # Client API endpoints
│   │       ├── admin/            # Admin API endpoints
│   │       └── webhook/          # Webhook receivers
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Layout components
│   │   ├── dashboard/            # Dashboard charts
│   │   └── calls/                # Call-related components
│   │
│   ├── lib/
│   │   ├── supabase/             # Supabase clients
│   │   ├── db/                   # Drizzle schema & queries
│   │   ├── validations/          # Zod schemas
│   │   ├── integrations/         # External API clients
│   │   └── utils.ts              # Utilities
│   │
│   └── middleware.ts             # Auth middleware
│
├── worker/                       # Background worker (separate deploy)
├── supabase/                     # Supabase config & migrations
└── tests/                        # Unit and E2E tests
```

---

## Database Schema

The application uses the following main tables:

- `tenants` - Organization accounts
- `users` - User accounts (linked to Supabase Auth)
- `pbx_connections` - PBX system integrations
- `cdr_records` - Call Detail Records
- `call_analyses` - AI analysis results
- `custom_keywords` - Custom keyword tracking
- `job_queue` - Background job processing
- `email_reports` - Email report schedules
- `billing_events` - Billing and usage tracking

---

## API Documentation

### Authentication

All API routes (except webhooks) require authentication via Supabase session cookies.

### Webhook Endpoints

#### Grandstream UCM Webhook

```
POST /api/webhook/grandstream/[connectionId]
```

Payload format:
```json
{
  "session_id": "string",
  "src": "string",
  "dst": "string",
  "start_time": "ISO 8601 timestamp",
  "disposition": "answered|no_answer|busy|failed",
  "recording_file": "string"
}
```

#### Generic Webhook

```
POST /api/webhook/generic/[connectionId]
```

Flexible payload format for other PBX systems.

### Dashboard API Endpoints

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/calls` - List calls with pagination
- `GET /api/dashboard/calls/[id]` - Get call details
- `GET /api/dashboard/calls/[id]/recording-url` - Get signed recording URL
- `GET /api/dashboard/calls/[id]/transcript` - Get call transcript
- `GET /api/dashboard/calls/export` - Export calls to CSV
- `POST /api/dashboard/reports/pdf` - Generate PDF report
- `GET /api/dashboard/billing` - Get billing information

### Admin API Endpoints

- `GET /api/admin/stats` - System-wide statistics
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant
- `GET /api/connections` - List PBX connections
- `POST /api/connections/[id]/test` - Test PBX connection
- `GET /api/jobs` - List background jobs

---

## PBX Integration Guide

### Grandstream UCM Setup

1. Log into your Grandstream UCM web interface
2. Navigate to **PBX** → **Call Features** → **Call Detail Records**
3. Enable **CDR Server**
4. Configure:
   - **Server URL**: `https://your-domain.com/api/webhook/grandstream/[connection-id]`
   - **Method**: POST
   - **Format**: JSON
5. Save and test the connection

### Generic PBX Setup

For other PBX systems that support webhooks:

1. Create a new PBX connection in AudiaPro admin panel
2. Copy the webhook URL provided
3. Configure your PBX to POST call events to this URL
4. Ensure the payload includes: call start time, participants, duration, disposition, and recording file path

---

## Background Worker

The worker processes call recordings in the background:

1. Downloads recording from PBX
2. Transcribes using Deepgram
3. Analyzes with OpenAI
4. Updates database with results

### Running the Worker

```bash
cd worker
npm install
npm start
```

### Worker Environment Variables

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=your-database-url
DEEPGRAM_API_KEY=your-deepgram-key
OPENAI_API_KEY=your-openai-key
WORKER_POLL_INTERVAL_MS=5000
WORKER_MAX_CONCURRENT_JOBS=3
```

---

## Deployment

### Deploy Frontend to Vercel

```bash
vercel --prod
```

Set environment variables in Vercel dashboard.

### Deploy Worker to Render

1. Create a new **Web Service** on Render
2. Connect your repository
3. Set **Build Command**: `cd worker && npm install`
4. Set **Start Command**: `cd worker && npm start`
5. Add environment variables
6. Deploy

---

## Development

### Run Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests with Playwright
```

### Database Migrations

```bash
npm run db:push       # Push schema changes
npm run db:generate   # Generate migration files
```

### Linting

```bash
npm run lint
```

---

## Security

- PBX credentials are encrypted with AES-256-GCM before storage
- All file access uses signed URLs with 1-hour expiry
- Webhook endpoints validate secret tokens
- Row-level security (RLS) enabled on all database tables
- CSP headers on all pages
- CORS restricted to production domain

---

## Pricing

- **Base**: $349/month
- **Per Call**: $0.10 per call analyzed
- **Users**: Unlimited
- **Features**: All features included

---

## Support

- Email: support@audiapro.com
- Documentation: https://docs.audiapro.com
- GitHub Issues: https://github.com/your-org/audiapro/issues

---

## License

Copyright © 2024 BotMakers Inc. All rights reserved.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
