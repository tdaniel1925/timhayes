@echo off
REM Railway Environment Variables Setup Script for Windows
REM Prerequisites: npm install -g @railway/cli
REM Run: railway login && railway link
REM Then run this script

echo Setting up Railway environment variables...
echo.

REM Critical Security Keys
railway variables set JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
railway variables set ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=

REM AI Services
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set TRANSCRIPTION_ENABLED=true
railway variables set SENTIMENT_ENABLED=true

REM Server Config
railway variables set PORT=5000
railway variables set DEBUG=false

REM Webhook Config
railway variables set WEBHOOK_PORT=5000
railway variables set WEBHOOK_USERNAME=admin
railway variables set WEBHOOK_PASSWORD=your_webhook_password

REM PayPal (update with your credentials when ready)
railway variables set PAYPAL_MODE=sandbox
REM railway variables set PAYPAL_CLIENT_ID=your_paypal_client_id
REM railway variables set PAYPAL_CLIENT_SECRET=your_paypal_client_secret

REM Email (update with your credentials when ready)
REM railway variables set RESEND_API_KEY=re_your_api_key
REM railway variables set RESEND_FROM_EMAIL=noreply@yourdomain.com

echo.
echo ================================
echo Core environment variables set!
echo ================================
echo.
echo WARNING: Remember to add PayPal and Resend credentials when ready
echo WARNING: Update FRONTEND_URL after deploying frontend
echo.
pause
