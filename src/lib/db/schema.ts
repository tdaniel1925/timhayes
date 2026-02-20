import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  jsonb,
  decimal,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// ===== ENUMS =====

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'cancelled']);

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'client_admin']);

export const providerTypeEnum = pgEnum('provider_type', [
  'grandstream_ucm',
  'freepbx',
  '3cx',
  'generic_webhook',
]);

export const connectionStatusEnum = pgEnum('connection_status', [
  'connected',
  'disconnected',
  'error',
]);

export const callDirectionEnum = pgEnum('call_direction', ['inbound', 'outbound', 'internal']);

export const dispositionEnum = pgEnum('disposition', [
  'answered',
  'no_answer',
  'busy',
  'failed',
  'congestion',
]);

export const processStatusEnum = pgEnum('process_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
]);

export const sentimentEnum = pgEnum('sentiment', ['positive', 'negative', 'neutral', 'mixed']);

export const escalationRiskEnum = pgEnum('escalation_risk', ['low', 'medium', 'high']);

export const satisfactionEnum = pgEnum('satisfaction', ['satisfied', 'neutral', 'dissatisfied']);

export const jobTypeEnum = pgEnum('job_type', [
  'download_recording',
  'transcribe',
  'analyze',
  'full_pipeline',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'retry',
]);

export const reportTypeEnum = pgEnum('report_type', [
  'daily_summary',
  'weekly_summary',
  'monthly_summary',
]);

export const billingStatusEnum = pgEnum('billing_status', [
  'open',
  'invoiced',
  'paid',
  'overdue',
]);

// ===== TABLES =====

// Table: tenants
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: tenantStatusEnum('status').notNull().default('active'),
  billingPlan: text('billing_plan').notNull().default('standard'),
  monthlyRateCents: integer('monthly_rate_cents').notNull().default(34900), // $349.00
  perCallRateCents: integer('per_call_rate_cents').notNull().default(10), // $0.10
  billingEmail: text('billing_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Table: users
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // references auth.users(id)
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Table: pbx_connections
export const pbxConnections = pgTable(
  'pbx_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    providerType: providerTypeEnum('provider_type').notNull(),
    host: text('host').notNull(),
    port: integer('port').notNull().default(8443),
    apiUsername: text('api_username'), // encrypted at rest
    apiPassword: text('api_password'), // encrypted at rest
    webhookSecret: text('webhook_secret').notNull(), // auto-generated
    webhookUrl: text('webhook_url').notNull(), // auto-generated
    isActive: boolean('is_active').notNull().default(true),
    lastConnectedAt: timestamp('last_connected_at', { withTimezone: true }),
    connectionStatus: connectionStatusEnum('connection_status').notNull().default('disconnected'),
    configJson: jsonb('config_json'), // provider-specific config
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('pbx_connections_tenant_id_idx').on(table.tenantId),
  })
);

// Table: cdr_records
export const cdrRecords = pgTable(
  'cdr_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    pbxConnectionId: uuid('pbx_connection_id')
      .notNull()
      .references(() => pbxConnections.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    callDirection: callDirectionEnum('call_direction'),
    src: text('src'),
    dst: text('dst'),
    callerName: text('caller_name'),
    clid: text('clid'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    answerTime: timestamp('answer_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    billsecSeconds: integer('billsec_seconds'),
    disposition: dispositionEnum('disposition'),
    actionType: text('action_type'),
    actionOwner: text('action_owner'),
    srcTrunkName: text('src_trunk_name'),
    dstTrunkName: text('dst_trunk_name'),
    recordingFilename: text('recording_filename'),
    recordingStoragePath: text('recording_storage_path'),
    recordingDurationMs: integer('recording_duration_ms'),
    recordingSizeBytes: integer('recording_size_bytes'),
    recordingDownloaded: boolean('recording_downloaded').notNull().default(false),
    recordingDownloadedAt: timestamp('recording_downloaded_at', { withTimezone: true }),
    transcriptStoragePath: text('transcript_storage_path'),
    transcriptStatus: processStatusEnum('transcript_status').notNull().default('pending'),
    analysisStatus: processStatusEnum('analysis_status').notNull().default('pending'),
    rawWebhookPayload: jsonb('raw_webhook_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('cdr_records_tenant_id_idx').on(table.tenantId),
    tenantIdStartTimeIdx: index('cdr_records_tenant_id_start_time_idx').on(
      table.tenantId,
      sql`${table.startTime} DESC`
    ),
    tenantIdDispositionIdx: index('cdr_records_tenant_id_disposition_idx').on(
      table.tenantId,
      table.disposition
    ),
    sessionIdIdx: index('cdr_records_session_id_idx').on(table.sessionId),
    pbxConnectionIdIdx: index('cdr_records_pbx_connection_id_idx').on(table.pbxConnectionId),
  })
);

// Table: call_analyses
export const callAnalyses = pgTable(
  'call_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cdrRecordId: uuid('cdr_record_id')
      .notNull()
      .unique()
      .references(() => cdrRecords.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    summary: text('summary'),
    sentimentOverall: sentimentEnum('sentiment_overall'),
    sentimentScore: decimal('sentiment_score', { precision: 3, scale: 2 }), // -1.00 to 1.00
    sentimentTimeline: jsonb('sentiment_timeline'), // [{timestamp_ms, sentiment, score}]
    talkRatio: jsonb('talk_ratio'), // {caller: 0.45, agent: 0.55}
    talkTimeSeconds: jsonb('talk_time_seconds'), // {caller: 120, agent: 150}
    silenceSeconds: integer('silence_seconds'),
    keywords: jsonb('keywords'), // [{keyword, count, context}]
    topics: jsonb('topics'), // [{topic, relevance_score}]
    actionItems: jsonb('action_items'), // [{description, assignee, deadline_mentioned}]
    callDispositionAi: text('call_disposition_ai'), // sale, support, complaint, etc.
    complianceScore: decimal('compliance_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
    complianceFlags: jsonb('compliance_flags'), // [{flag, description, passed}]
    escalationRisk: escalationRiskEnum('escalation_risk'),
    escalationReasons: jsonb('escalation_reasons'), // array of reasons
    satisfactionPrediction: satisfactionEnum('satisfaction_prediction'),
    satisfactionScore: decimal('satisfaction_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
    questionsAsked: jsonb('questions_asked'), // [{speaker, question, timestamp_ms}]
    objections: jsonb('objections'), // [{objection, response, outcome}]
    customKeywordMatches: jsonb('custom_keyword_matches'), // [{keyword_id, keyword, count, contexts}]
    wordCount: integer('word_count'),
    wordsPerMinute: jsonb('words_per_minute'), // {caller: 140, agent: 155}
    modelUsed: text('model_used'), // e.g., "claude-sonnet-4-5-20250929"
    processingTimeMs: integer('processing_time_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('call_analyses_tenant_id_idx').on(table.tenantId),
    tenantIdCreatedAtIdx: index('call_analyses_tenant_id_created_at_idx').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    cdrRecordIdIdx: index('call_analyses_cdr_record_id_idx').on(table.cdrRecordId),
  })
);

// Table: custom_keywords
export const customKeywords = pgTable(
  'custom_keywords',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    keyword: text('keyword').notNull(),
    category: text('category'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantKeywordUnique: unique('custom_keywords_tenant_keyword_unique').on(
      table.tenantId,
      table.keyword
    ),
  })
);

// Table: job_queue
export const jobQueue = pgTable(
  'job_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    cdrRecordId: uuid('cdr_record_id')
      .notNull()
      .references(() => cdrRecords.id, { onDelete: 'cascade' }),
    jobType: jobTypeEnum('job_type').notNull(),
    status: jobStatusEnum('status').notNull().default('pending'),
    priority: integer('priority').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusPriorityCreatedIdx: index('job_queue_status_priority_created_idx').on(
      table.status,
      sql`${table.priority} DESC`,
      sql`${table.createdAt} ASC`
    ),
    tenantIdIdx: index('job_queue_tenant_id_idx').on(table.tenantId),
  })
);

// Table: email_reports
export const emailReports = pgTable('email_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reportType: reportTypeEnum('report_type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  nextSendAt: timestamp('next_send_at', { withTimezone: true }),
  configJson: jsonb('config_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Table: billing_events
export const billingEvents = pgTable(
  'billing_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    billingMonth: date('billing_month').notNull(), // First day of billing month
    callCount: integer('call_count').notNull().default(0),
    monthlyChargeCents: integer('monthly_charge_cents').notNull(),
    perCallChargeCents: integer('per_call_charge_cents').notNull(),
    totalChargeCents: integer('total_charge_cents').notNull(),
    status: billingStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantMonthUnique: unique('billing_events_tenant_month_unique').on(
      table.tenantId,
      table.billingMonth
    ),
  })
);

// ===== RELATIONS =====

export const jobQueueRelations = relations(jobQueue, ({ one }) => ({
  tenant: one(tenants, {
    fields: [jobQueue.tenantId],
    references: [tenants.id],
  }),
  cdrRecord: one(cdrRecords, {
    fields: [jobQueue.cdrRecordId],
    references: [cdrRecords.id],
  }),
}));

export const cdrRecordsRelations = relations(cdrRecords, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [cdrRecords.tenantId],
    references: [tenants.id],
  }),
  pbxConnection: one(pbxConnections, {
    fields: [cdrRecords.pbxConnectionId],
    references: [pbxConnections.id],
  }),
  callAnalysis: one(callAnalyses, {
    fields: [cdrRecords.id],
    references: [callAnalyses.cdrRecordId],
  }),
  jobs: many(jobQueue),
}));

export const pbxConnectionsRelations = relations(pbxConnections, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pbxConnections.tenantId],
    references: [tenants.id],
  }),
}));
