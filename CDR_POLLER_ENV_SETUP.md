# CDR Poller Environment Variables

Add these to Render environment variables:

## Required:

```
UCM_API_BASE=https://071ffb.c.myucm.cloud/api
UCM_API_USERNAME=testco_webhook
UCM_API_PASSWORD=TestWebhook123!
CDR_POLL_INTERVAL=2
```

## Optional:

```
CDR_POLL_ENABLED=true
CDR_BACKFILL_HOURS=2
```

---

## Setup Steps:

1. Go to Render Dashboard
2. Select **audiapro-backend**
3. Click **Environment** tab
4. Add each variable above
5. Click **Save Changes**

The poller will start automatically on next deployment!
