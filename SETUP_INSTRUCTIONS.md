# AI Features Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Get Database URL from Railway

1. Go to https://railway.app
2. Select your project: "timhayes-bo-production"
3. Click on the "Variables" tab
4. Find and copy the `DATABASE_URL` value

### Step 2: Run Setup Script

Open PowerShell and run:

```powershell
# Set the DATABASE_URL (paste your value from Railway)
$env:DATABASE_URL="postgresql://postgres:..."

# Run the setup script
python setup_ai_features.py
```

This script will:
- ✅ Create super admin account (superadmin@audia.com)
- ✅ Seed all 24 AI features into the database
- ✅ Verify everything is set up correctly

### Step 3: Login to Super Admin Panel

1. Go to: https://timhayes-bo-production-58c5.up.railway.app/super-admin
2. Login with:
   - **Email**: superadmin@audia.com
   - **Password**: SuperAdmin123!
3. **IMPORTANT**: Change your password after first login!

### Step 4: Enable AI Features for Your Tenant

1. In the Super Admin panel, click on "Test Company" (or your tenant)
2. Scroll down to "AI Features & Pricing"
3. Select which features you want to enable
4. Adjust pricing if needed (optional)
5. Click "Save Feature Changes"

### Step 5: View Marketing Site

Visit: https://timhayes-bo-production-58c5.up.railway.app/features

You should now see all 24 AI features beautifully displayed!

## Optional: Enable AI Processing

To actually process calls with AI (not just store them):

1. Get an OpenAI API key from: https://platform.openai.com/api-keys
2. Add it to Railway:
   - Go to Railway → Variables tab
   - Add new variable: `OPENAI_API_KEY` = your key
   - Save changes
3. Restart your Railway app

## Troubleshooting

### Script Error: "DATABASE_URL not set"
- Make sure you copied the full DATABASE_URL from Railway
- Include quotes around the URL

### Script Error: "Connection failed"
- Check your internet connection
- Verify the DATABASE_URL is correct
- Try again in a few seconds

### Features Not Showing on Marketing Site
- Make sure the setup script completed successfully
- Check that it said "24 active features" at the end
- Try refreshing the browser (Ctrl+F5)

## What You Get

### 9 Categories of AI Features:

1. **Call Quality & Coaching** (5 features)
   - AI Call Summaries
   - Call Quality Scoring
   - Coaching Recommendations
   - Custom Scorecards

2. **Compliance & Risk Management** (2 features)
   - Compliance Monitoring
   - Call Recording & Storage

3. **Revenue Intelligence** (4 features)
   - Deal Risk Analysis
   - Objection Analysis
   - Intent Detection
   - Competitive Intelligence

4. **Automated Insights** (4 features)
   - Action Items Extraction
   - Topic Extraction
   - Automated Call Tagging
   - Trend Analysis

5. **Customer Intelligence** (4 features)
   - Sentiment Analysis
   - Emotion Detection
   - Churn Prediction
   - Customer Journey Mapping

6. **Real-Time AI** (1 feature)
   - Real-Time Agent Assist

7. **Advanced Analytics** (4 features)
   - Talk Time Analytics
   - Keyword Spotting
   - Agent Performance Benchmarking
   - Trend Analysis

8. **Multilingual & Global** (1 feature)
   - Multilingual Transcription (50+ languages)

9. **Integration Intelligence** (1 feature)
   - CRM Auto-Sync

**Total: 24 AI Features**

## Pricing Examples

- **Starter Package**: $247/month (Transcription, Summaries, Sentiment)
- **Growth Package**: $796/month (All coaching + compliance features)
- **Enterprise Package**: $2,499/month (All 24 features)

Each feature can be priced individually, and you can customize pricing per tenant!

## Next Steps

1. ✅ Run the setup script
2. ✅ Login to super admin panel
3. ✅ Enable features for your tenant
4. ✅ Add OpenAI API key (optional, for AI processing)
5. ✅ Test with a real call from your UCM
6. ✅ Show the marketing site to potential customers!

---

**Need Help?**

- Check the logs: `python setup_ai_features.py`
- Review: AI_FEATURES_SYSTEM_COMPLETE.md
- Review: UCM_SETUP_GUIDE.md
