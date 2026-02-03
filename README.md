# Grandstream Call Analytics System

Automatically transcribe and analyze call recordings from your Grandstream CloudUCM system using AI.

## Features

- **Real-time CDR Processing** - Receives call data instantly via webhook
- **Automatic Recording Download** - Downloads call recordings from UCM
- **AI Transcription** - Transcribes audio using OpenAI Whisper
- **Sentiment Analysis** - Analyzes customer sentiment (positive/negative)
- **Web Dashboard** - View all calls, transcriptions, and sentiment scores
- **SQLite Database** - Stores all data locally

## Quick Start

### 1. Install Dependencies

```bash
pip install Flask requests openai python-dotenv
```

### 2. Configure

Create a `.env` file:

```env
UCM_IP=192.168.1.100
UCM_USERNAME=admin
UCM_PASSWORD=your_password
WEBHOOK_USERNAME=admin
WEBHOOK_PASSWORD=webhook_password
OPENAI_API_KEY=sk-your-openai-key
TRANSCRIPTION_ENABLED=true
SENTIMENT_ENABLED=true
```

### 3. Run Server

```bash
python call-analytics-server.py
```

### 4. Configure CloudUCM

In your CloudUCM web interface:

1. Go to: **Integrations → API Configuration → CDR Real-Time Output Settings**
2. Set:
   - **Enable**: ✓
   - **Server Address**: `YOUR_SERVER_IP` (e.g., `192.168.1.50`)
   - **Port**: `5000`
   - **Delivery Method**: `HTTP/HTTPS`
   - **Format**: `JSON`
   - **Username**: `admin`
   - **Password**: `webhook_password`
3. Click **Save**

### 5. View Dashboard

Open: http://localhost:5000

## What Happens Now?

1. When a call ends, CloudUCM sends CDR data to your server
2. Server downloads the call recording
3. OpenAI Whisper transcribes the audio
4. Sentiment analysis determines if call was positive/negative
5. Everything appears in the web dashboard

## Files Created

- **call-analytics-server.py** - Main application
- **requirements.txt** - Dependencies
- **.env** - Your configuration
- **SETUP.md** - Detailed setup guide
- **call_analytics.db** - Database (auto-created)
- **recordings/** - Downloaded audio files

## Need Help?

See **SETUP.md** for detailed troubleshooting and advanced configuration.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  CloudUCM   │ CDR/JSON│    Flask     │  Audio  │   OpenAI    │
│   System    ├────────>│   Webhook    ├────────>│   Whisper   │
│             │         │   Server     │         │     API     │
└─────────────┘         └──────┬───────┘         └─────────────┘
                               │
                               v
                        ┌──────────────┐
                        │   SQLite DB  │
                        │  Transcripts │
                        │  Sentiment   │
                        └──────────────┘
                               │
                               v
                        ┌──────────────┐
                        │     Web      │
                        │  Dashboard   │
                        └──────────────┘
```

## Costs

- OpenAI Whisper: ~$0.006/minute
- Example: 100 calls/day @ 5 min = ~$3/day

## Screenshot from Your CloudUCM

Your current settings show HTTP/HTTPS delivery method with JSON format - perfect! Just update the server address from `0.0.0.0` to your actual server IP.

## Next Steps

1. Test with a call
2. Check dashboard at http://localhost:5000
3. Review transcriptions
4. Customize for your needs
