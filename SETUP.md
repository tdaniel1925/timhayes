# Grandstream Call Analytics Setup Guide

Complete guide to set up call recording transcription and sentiment analysis for your CloudUCM system.

## Overview

This system will:
1. Receive real-time CDR (Call Detail Records) from your CloudUCM via webhook
2. Download call recordings from the UCM
3. Transcribe recordings using AI (OpenAI Whisper)
4. Perform sentiment analysis on transcriptions
5. Store everything in a database with a web dashboard

## Prerequisites

- Python 3.8 or higher
- Access to your CloudUCM admin interface
- OpenAI API key (for transcription) - Get one at https://platform.openai.com/api-keys
- A server/computer that can:
  - Run Python
  - Be accessible from your CloudUCM (same network or public IP)
  - Stay online to receive webhooks

## Step 1: Install Python Dependencies

Open a terminal/command prompt in this directory and run:

```bash
# Install required packages
pip install Flask requests python-dotenv

# Install OpenAI for transcription (recommended)
pip install openai

# Optional: Install for local sentiment analysis
pip install transformers torch
```

Or install everything at once:
```bash
pip install -r requirements.txt
```

**Note**: Installing `transformers` and `torch` may take a while and require several GB of disk space.

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```env
   # Your CloudUCM IP address
   UCM_IP=192.168.1.100

   # CloudUCM admin credentials (for downloading recordings)
   UCM_USERNAME=admin
   UCM_PASSWORD=your_actual_password

   # Webhook credentials (must match what you set in CloudUCM)
   WEBHOOK_USERNAME=admin
   WEBHOOK_PASSWORD=your_webhook_password

   # OpenAI API key for transcription
   OPENAI_API_KEY=sk-your-actual-api-key

   # Enable features
   TRANSCRIPTION_ENABLED=true
   SENTIMENT_ENABLED=true
   ```

## Step 3: Find Your Server's IP Address

Your CloudUCM needs to know where to send CDR data. Find your server's IP address:

### On Windows:
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.50)

### On Linux/Mac:
```bash
ip addr show
# or
ifconfig
```
Look for your local IP address (e.g., 192.168.1.50)

**Important**:
- If your server and CloudUCM are on the same network, use the local IP (192.168.x.x)
- If your CloudUCM is in the cloud or different network, you'll need a public IP or VPN

## Step 4: Test the Server Locally

Before configuring CloudUCM, test that the server runs:

```bash
python call-analytics-server.py
```

You should see:
```
============================================================
Starting Grandstream Call Analytics Server
============================================================
UCM IP: 192.168.1.100
Webhook Port: 5000
Transcription: Enabled
Sentiment Analysis: Enabled
============================================================
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.1.50:5000
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status":"healthy","transcription":"openai","sentiment":"enabled"}
```

## Step 5: Configure CloudUCM API

Now configure your CloudUCM to send CDR data to your server:

1. **Log into CloudUCM** web interface

2. **Navigate to**: `Integrations` → `API Configuration` → `CDR Real-Time Output Settings`

3. **Configure the following**:
   - **Enable**: ✓ (checked)
   - **Server Address**: `YOUR_SERVER_IP` (e.g., `192.168.1.50`)
   - **Port**: `5000`
   - **Delivery Method**: `HTTP/HTTPS`
   - **Format**: `JSON`
   - **Username**: `admin` (must match WEBHOOK_USERNAME in .env)
   - **Password**: `your_webhook_password` (must match WEBHOOK_PASSWORD in .env)

4. **Click "Save"**

## Step 6: Test with a Call

1. Make sure your Python server is running:
   ```bash
   python call-analytics-server.py
   ```

2. Make a test call on your UCM system (ideally a recorded call)

3. Watch the server logs - you should see:
   ```
   Received CDR: 1738412400.1 | 1001 -> 9785551234 | ANSWERED
   Saved CDR 1738412400.1 (ID: 1)
   Processing recording for 1738412400.1
   ```

4. Open your web browser and go to: `http://localhost:5000`
   - You should see your call in the dashboard

## Step 7: View the Dashboard

The web dashboard is available at:
- **Local**: http://localhost:5000
- **Network**: http://YOUR_SERVER_IP:5000 (e.g., http://192.168.1.50:5000)

The dashboard shows:
- Total calls received
- Recordings downloaded
- Transcriptions completed
- Sentiment analyses performed
- Recent calls table with transcriptions and sentiment

## Troubleshooting

### CloudUCM not sending data

1. **Check server is running**: Make sure `call-analytics-server.py` is running
2. **Check firewall**: Ensure port 5000 is open on your server
   ```bash
   # Windows: Add firewall rule in Windows Defender Firewall
   # Linux:
   sudo ufw allow 5000
   ```
3. **Check IP address**: Verify CloudUCM has correct server IP
4. **Check credentials**: Username/password must match exactly
5. **Check logs**: Look at `call_analytics.log` for errors

### Recordings not downloading

1. **Check UCM credentials**: Verify UCM_USERNAME and UCM_PASSWORD in .env
2. **Check recording path**: CDR must include `recordfiles` field
3. **Enable recording**: Make sure call recording is enabled in UCM
4. **Check logs**: Look for download errors in the console

### Transcription not working

1. **Check OpenAI API key**: Verify OPENAI_API_KEY is correct
2. **Check balance**: Ensure you have credits at https://platform.openai.com/usage
3. **Check audio format**: UCM recordings should be WAV or other common formats
4. **Set TRANSCRIPTION_ENABLED=true** in .env

### Sentiment analysis not working

1. **Install dependencies**: `pip install transformers torch`
2. **First run is slow**: Model downloads on first use (~500MB)
3. **Set SENTIMENT_ENABLED=true** in .env

## Advanced Configuration

### Running as a Service (Production)

For production, use a proper WSGI server:

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn (Linux/Mac)
gunicorn -w 4 -b 0.0.0.0:5000 call-analytics-server:app

# Windows: Use waitress
pip install waitress
waitress-serve --listen=*:5000 call-analytics-server:app
```

### HTTPS Configuration

For HTTPS support, use nginx or Apache as a reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Using Local Transcription (No OpenAI)

If you want to avoid OpenAI costs, you can use local Whisper:

1. Install additional dependencies:
   ```bash
   pip install openai-whisper
   ```

2. Modify the `TranscriptionService` class in `call-analytics-server.py` to use local Whisper

**Note**: Local transcription is slower but free.

### Database Queries

The system uses SQLite. To query the database:

```bash
sqlite3 call_analytics.db

# Example queries:
SELECT * FROM cdr_records ORDER BY received_at DESC LIMIT 10;
SELECT * FROM transcriptions;
SELECT * FROM sentiment_analysis;
```

## File Structure

```
call-analytics-server.py    # Main application
requirements.txt            # Python dependencies
.env                       # Your configuration (not in git)
.env.example              # Example configuration
SETUP.md                  # This file
call_analytics.db         # SQLite database (created automatically)
call_analytics.log        # Application logs
recordings/               # Downloaded call recordings
```

## API Endpoints

- **POST /cdr** - Receives CDR webhooks from CloudUCM
- **GET /** - Web dashboard
- **GET /health** - Health check
- **GET /stats** - JSON statistics

## Security Notes

1. **Change default passwords**: Don't use "admin/password"
2. **Use HTTPS in production**: Especially if exposed to internet
3. **Restrict access**: Use firewall rules to limit access to trusted IPs
4. **Secure your .env**: Never commit .env to git
5. **Rotate credentials**: Change passwords regularly

## Cost Estimates

### OpenAI Whisper API
- ~$0.006 per minute of audio
- Example: 100 calls/day @ 5 min avg = 500 min/day = ~$3/day = ~$90/month

### Alternative: Local Transcription
- Free but requires GPU for decent speed
- CPU transcription is very slow

## Getting Help

If you run into issues:

1. Check the logs: `call_analytics.log`
2. Test each component separately:
   - Server running: `curl http://localhost:5000/health`
   - Database created: Check for `call_analytics.db` file
   - CloudUCM connectivity: Check CloudUCM can reach your server
3. Review CloudUCM documentation: See `grandstream-api-integration.md`

## Next Steps

Once everything is working:

1. **Monitor the system**: Check logs regularly
2. **Analyze results**: Review transcriptions and sentiment
3. **Customize**: Modify the code to add custom business logic
4. **Scale**: If processing many calls, consider using Celery for background tasks
5. **Export data**: Add features to export to CRM, analytics tools, etc.

## Example Use Cases

- **Quality assurance**: Review call transcriptions for agent performance
- **Sentiment tracking**: Monitor customer satisfaction trends
- **Compliance**: Automatically flag calls with certain keywords
- **Analytics**: Identify common customer issues
- **Training**: Use transcriptions for agent training materials

## License

This code is provided as-is for your use with Grandstream UCM systems.
