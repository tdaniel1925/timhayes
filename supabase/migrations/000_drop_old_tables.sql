-- Drop old tables before running fresh migrations
-- WARNING: This will delete all existing data!

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS job_queue CASCADE;
DROP TABLE IF EXISTS call_analyses CASCADE;
DROP TABLE IF EXISTS cdr_records CASCADE;
DROP TABLE IF EXISTS pbx_connections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop old tables from previous development
DROP TABLE IF EXISTS ucm_sessions CASCADE;
DROP TABLE IF EXISTS billing_events CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS setup_requests CASCADE;
DROP TABLE IF EXISTS notification_rules CASCADE;
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS tenant_ai_features CASCADE;
DROP TABLE IF EXISTS ai_features CASCADE;
DROP TABLE IF EXISTS transcriptions CASCADE;
DROP TABLE IF EXISTS ai_summaries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS call_quality_scores CASCADE;
DROP TABLE IF EXISTS emotion_detections CASCADE;
DROP TABLE IF EXISTS compliance_alerts CASCADE;
DROP TABLE IF EXISTS talk_time_metrics CASCADE;
DROP TABLE IF EXISTS deal_risk_scores CASCADE;
DROP TABLE IF EXISTS churn_predictions CASCADE;
DROP TABLE IF EXISTS objection_analyses CASCADE;
DROP TABLE IF EXISTS sentiment_analysis CASCADE;
DROP TABLE IF EXISTS revenue_metrics CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS call_metrics CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS usage_quotas CASCADE;
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS plan_features CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS prompt_customizations CASCADE;

-- Drop custom types if any
DROP TYPE IF EXISTS user_role CASCADE;

-- Success message
SELECT 'All old tables dropped successfully!' as status;
