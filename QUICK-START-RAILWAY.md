# Quick Start - Railway Deployment

## 🚀 Deploy in 5 Minutes

### 1. Login to Railway
Go to: https://railway.app → Login with GitHub

### 2. Create Project
- Click **New Project**
- Select **Deploy from GitHub repo**
- Choose: **tdaniel1925/timhayes**

### 3. Add Environment Variables
In Railway dashboard → **Variables** tab:

```
UCM_IP=YOUR_CLOUDUCM_IP
UCM_USERNAME=admin
UCM_PASSWORD=your_ucm_password
UCM_HTTPS_PORT=8089
WEBHOOK_USERNAME=admin
WEBHOOK_PASSWORD=choose_a_password
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE
TRANSCRIPTION_ENABLED=true
SENTIMENT_ENABLED=true
```

### 4. Get Your URL
Railway **Settings** → **Domains** → **Generate Domain**

You'll get: `https://yourapp.up.railway.app`

### 5. Update CloudUCM
**IMPORTANT CHANGES for Railway:**

| Setting | Value |
|---------|-------|
| **Server Address** | `yourapp.up.railway.app` (your Railway domain) |
| **Port** | `443` (not 5000!) |
| **Delivery Method** | `HTTPS` (not HTTP!) |
| **Format** | `JSON` |
| **Username** | `admin` |
| **Password** | Your webhook password |

### 6. Test
- Make a call on UCM
- Visit: `https://yourapp.up.railway.app`
- See your call in the dashboard!

## 🔍 View Logs
Railway dashboard → **Deployments** → Click latest → See logs

## ❌ Troubleshooting
- **No webhooks?** Check domain, port (443), and HTTPS
- **No transcription?** Check OPENAI_API_KEY
- **Unauthorized?** Username/password must match exactly

## 📝 Key Differences from Local

| Local | Railway |
|-------|---------|
| `localhost:5000` | `yourapp.up.railway.app` |
| Port 5000 | Port 443 |
| HTTP | HTTPS |
| IP: 10.0.0.212 | Domain: yourapp.up.railway.app |

## 💰 Cost
- Railway: ~$5-10/month (has free trial)
- OpenAI: ~$0.006/min of audio

## ✅ You're Done!
Your call analytics system is now live on the internet!
