/**
 * Vitest setup file
 * Sets mock environment variables for all tests
 */

// Set mock environment variables before any modules are loaded
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
