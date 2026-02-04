#!/bin/bash
# Railway Environment Variables Setup Script
# Run this after: railway login && railway link

echo "Setting up Railway environment variables..."

# Critical Security Keys
railway variables set JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
railway variables set ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=

# AI Services
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set TRANSCRIPTION_ENABLED=true
railway variables set SENTIMENT_ENABLED=true

# Server Config
railway variables set PORT=5000
railway variables set DEBUG=false

# Webhook Config
railway variables set WEBHOOK_PORT=5000
railway variables set WEBHOOK_USERNAME=admin
railway variables set WEBHOOK_PASSWORD=your_webhook_password

# PayPal (update with your credentials when ready)
railway variables set PAYPAL_MODE=sandbox
# railway variables set PAYPAL_CLIENT_ID=your_paypal_client_id
# railway variables set PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email (update with your credentials when ready)
# railway variables set RESEND_API_KEY=re_your_api_key
# railway variables set RESEND_FROM_EMAIL=noreply@yourdomain.com

echo "✅ Core environment variables set!"
echo "⚠️  Remember to add PayPal and Resend credentials when ready"
echo "⚠️  Update FRONTEND_URL after deploying frontend"
