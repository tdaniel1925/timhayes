# Render CLI Setup Guide

## ✅ Render CLI Installed Successfully!

**Version:** v0.1.11
**Location:** `~/bin/render.exe`

## Next Steps: Configure Render CLI

### 1. Get Your Render API Key

1. Go to: https://dashboard.render.com/
2. Click your profile icon (top right)
3. Select **"Account Settings"**
4. Click **"API Keys"** in the left sidebar
5. Click **"Create API Key"**
6. Give it a name: "CLI Access"
7. Click **"Create API Key"**
8. **COPY THE KEY** (you won't see it again!)

### 2. Configure Render CLI

Run this command and paste your API key when prompted:

```bash
~/bin/render.exe config init
```

It will ask:
- **API Key:** Paste your key from step 1
- **Profile Name:** Press Enter (use default)
- **Default Region:** `oregon` (where your backend is)

### 3. Verify Configuration

```bash
~/bin/render.exe services list
```

You should see your services:
- audiapro-backend
- audiapro-frontend (if configured)

## Useful Render CLI Commands

### View Services
```bash
~/bin/render.exe services list
```

### View Service Details
```bash
~/bin/render.exe services get audiapro-backend
```

### View Recent Logs
```bash
~/bin/render.exe services logs audiapro-backend
```

### View Deploys
```bash
~/bin/render.exe deploys list audiapro-backend
```

### View Environment Variables
```bash
~/bin/render.exe services env list audiapro-backend
```

### Set Environment Variable
```bash
~/bin/render.exe services env set audiapro-backend UCM_IP=071ffb.c.myucm.cloud
~/bin/render.exe services env set audiapro-backend UCM_USERNAME=admin
~/bin/render.exe services env set audiapro-backend UCM_PASSWORD=BotMakers@2026
~/bin/render.exe services env set audiapro-backend UCM_PORT=8443
```

### Trigger Manual Deploy
```bash
~/bin/render.exe deploys create audiapro-backend
```

## Adding Render to Your PATH (Optional)

To use `render` instead of `~/bin/render.exe`:

**PowerShell (Current Session):**
```powershell
$env:PATH += ";$HOME\bin"
```

**Permanently (Windows):**
1. Press Win + R
2. Type: `sysdm.cpl`
3. Advanced tab → Environment Variables
4. Under "User variables", find "Path"
5. Click "Edit" → "New"
6. Add: `C:\Users\YourUsername\bin`
7. Click OK

Then you can just use:
```bash
render services list
render services logs audiapro-backend
```

## What We Can Do with Render CLI

Now we can:
1. ✅ View deployment logs directly from terminal
2. ✅ Set UCM environment variables without using dashboard
3. ✅ Check service status and health
4. ✅ Trigger manual deploys
5. ✅ View recent deploy history
6. ✅ Debug issues faster

## Next: Set UCM Environment Variables

Once configured, we can set the UCM credentials directly from CLI:

```bash
~/bin/render.exe services env set audiapro-backend UCM_IP=071ffb.c.myucm.cloud
~/bin/render.exe services env set audiapro-backend UCM_USERNAME=admin
~/bin/render.exe services env set audiapro-backend UCM_PASSWORD=BotMakers@2026
~/bin/render.exe services env set audiapro-backend UCM_PORT=8443
```

Then recordings will start downloading automatically!

## Troubleshooting

**"Authentication failed":**
- Check your API key is correct
- Generate a new API key if needed

**"Service not found":**
- Run `render services list` to see available services
- Check service name matches exactly (case-sensitive)

**"Permission denied":**
- Make sure your API key has proper permissions
- May need owner/admin access to modify environment variables
