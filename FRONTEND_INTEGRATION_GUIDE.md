# Frontend Integration Guide
## How to Display Calls, Recordings, Transcriptions & AI Analysis

## Overview

Now that the backend is collecting calls and processing recordings with AI, here's how the frontend should display everything in the user dashboard.

## Data Flow

```
CloudUCM → CDR Poller → Database → Recording Scraper → Supabase Storage
                ↓                              ↓
         Frontend Fetch                 AI Processing
                ↓                              ↓
         Display Calls                  Transcription + Sentiment + Summary
```

## API Endpoints Available

### 1. Get Calls List
```http
GET /api/calls?page=1&per_page=25
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 25)
- `search` - Search by caller/callee/name
- `status` - Filter by disposition (ANSWERED, NO ANSWER, BUSY)
- `sentiment` - Filter by sentiment (positive, negative, neutral)
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)
- `min_duration` - Minimum call duration (seconds)
- `max_duration` - Maximum call duration (seconds)

**Response:**
```json
{
  "calls": [
    {
      "id": 1,
      "uniqueid": "1738853696.123",
      "src": "1000",
      "dst": "2815058290",
      "caller_name": "John Doe",
      "start_time": "2026-02-06T16:21:36",
      "duration": 65,
      "billsec": 58,
      "disposition": "ANSWERED",
      "recording_path": "/monitor/2026/02/06/...",
      "has_recording": true,
      "recording_available": true,
      "transcription": "Full transcription text here...",
      "sentiment": "positive",
      "sentiment_score": 0.85,
      "ai_summary": "Customer called about billing issue. Agent resolved it promptly."
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 42,
    "pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

### 2. Get Recording URL (for audio playback)
```http
GET /api/recording/<call_id>
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "url": "https://fcubjohwzfhjcwcnwost.supabase.co/storage/v1/object/sign/call-recordings/tenant_1/1738853696.123_recording.wav?token=...",
  "type": "supabase"
}
```

**Note:** URL expires in 1 hour (3600 seconds). Request a new one when needed.

### 3. Get Single Call Details
```http
GET /api/calls/<call_id>
Authorization: Bearer <jwt_token>
```

Returns full call details including transcription, sentiment, and AI summary.

### 4. Get AI Summary
```http
GET /api/calls/<call_id>/ai-summary
Authorization: Bearer <jwt_token>
```

Returns detailed AI analysis including:
- Transcription
- Sentiment analysis
- AI-generated summary
- Key points

## Frontend Implementation

### 1. Call List Page

**Display in a table/list:**
```jsx
// Example React component structure
<CallsTable>
  <CallRow>
    <td>{call.caller_name || call.src}</td>
    <td>{call.dst}</td>
    <td>{formatDate(call.start_time)}</td>
    <td>{formatDuration(call.duration)}</td>
    <td>
      <StatusBadge status={call.disposition} />
    </td>
    <td>
      {call.sentiment && <SentimentBadge sentiment={call.sentiment} score={call.sentiment_score} />}
    </td>
    <td>
      {call.recording_available && (
        <PlayButton callId={call.id} />
      )}
      <ViewDetailsButton callId={call.id} />
    </td>
  </CallRow>
</CallsTable>
```

**Key Elements:**
- ✅ Show caller & callee info
- ✅ Display call duration & timestamp
- ✅ Status badge (ANSWERED = green, NO ANSWER = yellow, BUSY = red)
- ✅ Sentiment indicator (😊 positive, 😐 neutral, ☹️ negative)
- ✅ Play button (only if `recording_available === true`)
- ✅ View Details button to open modal/detail page

### 2. Audio Player Component

When user clicks "Play" button:

```jsx
// Pseudo-code
const PlayRecording = ({ callId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);

    // Fetch signed URL from backend
    const response = await fetch(`/api/recording/${callId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    setAudioUrl(data.url);
    setLoading(false);
  };

  return (
    <>
      <button onClick={handlePlay} disabled={loading}>
        {loading ? 'Loading...' : '▶ Play'}
      </button>

      {audioUrl && (
        <audio controls src={audioUrl} autoPlay>
          Your browser doesn't support audio playback
        </audio>
      )}
    </>
  );
};
```

**Important:**
- Fetch the signed URL **only when user clicks play** (not in advance)
- URLs expire after 1 hour, so request new URL if playback fails
- Use HTML5 `<audio>` element for playback

### 3. Call Detail Modal/Page

When user clicks "View Details":

```jsx
<CallDetailModal callId={callId}>
  <Header>
    <h2>Call Details</h2>
    <CloseButton />
  </Header>

  <Section title="Call Information">
    <InfoRow label="From" value={call.src} />
    <InfoRow label="To" value={call.dst} />
    <InfoRow label="Time" value={formatDateTime(call.start_time)} />
    <InfoRow label="Duration" value={formatDuration(call.duration)} />
    <InfoRow label="Status" value={call.disposition} />
  </Section>

  <Section title="Recording">
    {call.recording_available ? (
      <AudioPlayer callId={call.id} />
    ) : (
      <p>Recording not available</p>
    )}
  </Section>

  <Section title="Sentiment Analysis">
    <SentimentMeter
      sentiment={call.sentiment}
      score={call.sentiment_score}
    />
  </Section>

  <Section title="AI Summary">
    <div className="summary-box">
      {call.ai_summary || "AI analysis in progress..."}
    </div>
  </Section>

  <Section title="Transcription">
    <div className="transcript-box">
      {call.transcription || "Transcription in progress..."}
    </div>
  </Section>
</CallDetailModal>
```

**Key Features:**
- ✅ Full call metadata
- ✅ Embedded audio player
- ✅ Visual sentiment indicator (meter, emoji, color-coded)
- ✅ AI-generated summary (key points)
- ✅ Full transcription text
- ✅ Download transcription button (optional)

### 4. Filters & Search

Add filter controls:

```jsx
<FiltersBar>
  <SearchInput
    placeholder="Search caller, callee, or name"
    onChange={handleSearch}
  />

  <DateRangePicker
    from={dateFrom}
    to={dateTo}
    onChange={handleDateChange}
  />

  <Select
    label="Status"
    options={['All', 'ANSWERED', 'NO ANSWER', 'BUSY']}
    onChange={handleStatusFilter}
  />

  <Select
    label="Sentiment"
    options={['All', 'positive', 'neutral', 'negative']}
    onChange={handleSentimentFilter}
  />

  <DurationSlider
    min={0}
    max={600}
    onChange={handleDurationFilter}
  />
</FiltersBar>
```

## UI/UX Recommendations

### Visual Indicators

**Sentiment Colors:**
- 🟢 Positive: Green (#4CAF50)
- 🟡 Neutral: Yellow (#FFC107)
- 🔴 Negative: Red (#F44336)

**Status Colors:**
- ✅ ANSWERED: Green
- ⚠️ NO ANSWER: Yellow
- ❌ BUSY: Red
- ⚠️ FAILED: Gray

**Recording Status:**
- 🎵 Available: Show play button
- ⏳ Processing: Show "Processing..." with spinner
- ❌ Not available: Gray out or hide play button

### Loading States

Show appropriate loading states:
- `"AI analysis in progress..."` - For calls without transcription yet
- `"Processing recording..."` - While scraper downloads audio
- Skeleton loaders for table rows while fetching

### Real-Time Updates (Optional)

Consider adding WebSocket or polling for real-time updates:
- New calls appear automatically
- AI processing status updates live
- Recording availability updates

## Testing the Integration

### 1. Verify API Access

Test in browser console or Postman:
```javascript
// Get calls
fetch('https://audiapro-backend.onrender.com/api/calls', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(r => r.json())
.then(console.log);

// Get recording URL
fetch('https://audiapro-backend.onrender.com/api/recording/1', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(r => r.json())
.then(console.log);
```

### 2. Check Data Availability

From the backend, you should have:
- ✅ 42 CDR records (from poller)
- ⏳ Recordings being downloaded by scraper (check logs)
- ⏳ AI processing running (transcriptions + sentiment)

### 3. Verify Audio Playback

Test audio URL directly:
1. Get signed URL from `/api/recording/1`
2. Open URL in new tab
3. Should download/play WAV file

## Example Data Flow

**Scenario: User views call in dashboard**

1. **Frontend** calls `GET /api/calls?page=1`
2. **Backend** returns list with `recording_available: true` for calls with recordings
3. **User** clicks play button on a call
4. **Frontend** calls `GET /api/recording/123`
5. **Backend** generates signed Supabase URL (1 hour expiry)
6. **Frontend** receives URL and plays in `<audio>` element
7. **User** sees transcription and AI summary in detail view

## Troubleshooting

**No recordings showing?**
- Check scraper logs: https://dashboard.render.com/worker/srv-d63d5k4r85hc73b4iap0
- Verify Supabase bucket has files
- Check database: `SELECT COUNT(*) FROM cdr_records WHERE recording_local_path IS NOT NULL`

**Audio won't play?**
- Check browser console for CORS errors
- Verify signed URL isn't expired
- Try opening URL directly in new tab

**No transcriptions?**
- AI processing takes 30-60 seconds per call
- Check `OPENAI_API_KEY` is set in backend
- Verify `TRANSCRIPTION_ENABLED=true`

**Missing sentiment?**
- Sentiment analysis runs after transcription
- Check `SENTIMENT_ENABLED=true`
- Requires valid transcription first

## Summary

**What you have now:**
- ✅ Backend collecting calls every 2 minutes
- ✅ Scraper downloading recordings every 5 minutes
- ✅ Recordings stored in Supabase Storage
- ✅ AI processing (transcription + sentiment + summary)
- ✅ API endpoints ready for frontend

**What you need to build:**
- ⏳ Frontend call list page
- ⏳ Audio player component
- ⏳ Call detail modal/page
- ⏳ Filters and search UI
- ⏳ Display transcriptions and AI summaries

The backend is fully operational! Now it's just about building the UI to display all this data beautifully. 🎉
