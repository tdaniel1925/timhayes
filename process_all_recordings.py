"""
Process all recordings: Generate transcripts and AI summaries
"""
import os
import sys
import psycopg2
from openai import OpenAI
import logging
from pathlib import Path
from supabase_storage import SupabaseStorageManager
import tempfile

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres')

# Initialize OpenAI
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not set!")
    sys.exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Supabase Storage
storage = SupabaseStorageManager(
    supabase_url=os.environ.get('SUPABASE_URL', 'https://fcubjohwzfhjcwcnwost.supabase.co'),
    supabase_key=os.environ.get('SUPABASE_KEY'),
    bucket_name='recordings'
)

def get_calls_needing_processing():
    """Get all calls with recordings that need AI processing"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute('''
        SELECT c.id, c.tenant_id, c.recording_local_path, c.src, c.dst, c.duration,
               t.id as has_transcript
        FROM cdr_records c
        LEFT JOIN transcriptions t ON c.id = t.cdr_id
        WHERE c.tenant_id = 1
          AND c.recording_local_path IS NOT NULL
        ORDER BY c.id DESC
    ''')

    calls = cur.fetchall()
    conn.close()
    return calls

def save_transcript(cdr_id, transcript_text):
    """Save transcript to database"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Check if transcript exists
    cur.execute('SELECT id FROM transcriptions WHERE cdr_id = %s', (cdr_id,))
    existing = cur.fetchone()

    if existing:
        # Update existing
        cur.execute('''
            UPDATE transcriptions
            SET transcript_text = %s, updated_at = NOW()
            WHERE cdr_id = %s
        ''', (transcript_text, cdr_id))
        logger.info(f"Updated transcript for call {cdr_id}")
    else:
        # Insert new
        cur.execute('''
            INSERT INTO transcriptions (cdr_id, transcript_text, created_at)
            VALUES (%s, %s, NOW())
        ''', (cdr_id, transcript_text))
        logger.info(f"Created transcript for call {cdr_id}")

    conn.commit()
    conn.close()

def save_ai_summary(cdr_id, summary_data):
    """Save AI summary to database"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Check if summary exists
    cur.execute('SELECT id FROM ai_summaries WHERE cdr_id = %s', (cdr_id,))
    existing = cur.fetchone()

    summary_text = summary_data.get('summary', '')
    topics = '\n'.join(summary_data.get('key_points', []))
    action_items = '\n'.join(summary_data.get('action_items', []))
    customer_intent = summary_data.get('customer_intent', 'Unknown')
    call_outcome = summary_data.get('sentiment', 'neutral')

    if existing:
        # Update existing
        cur.execute('''
            UPDATE ai_summaries
            SET summary_text = %s, topics = %s, action_items = %s,
                customer_intent = %s, call_outcome = %s, generated_at = NOW()
            WHERE cdr_id = %s
        ''', (summary_text, topics, action_items, customer_intent, call_outcome, cdr_id))
        logger.info(f"Updated AI summary for call {cdr_id}")
    else:
        # Insert new
        cur.execute('''
            INSERT INTO ai_summaries (cdr_id, summary_text, topics, action_items,
                                    customer_intent, call_outcome, generated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ''', (cdr_id, summary_text, topics, action_items, customer_intent, call_outcome))
        logger.info(f"Created AI summary for call {cdr_id}")

    conn.commit()
    conn.close()

def transcribe_audio(audio_file_path):
    """Transcribe audio using OpenAI Whisper"""
    try:
        with open(audio_file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return None

def generate_ai_summary(transcript_text, call_info):
    """Generate AI summary from transcript"""
    try:
        prompt = f"""Analyze this phone call transcript and provide:
1. A brief summary (2-3 sentences)
2. Sentiment (positive/neutral/negative)
3. Key points/topics discussed (3-5 bullet points)
4. Action items (if any)
5. Customer intent (e.g., "Support Request", "Sales Inquiry", "General Question")

Call details:
- From: {call_info['from']}
- To: {call_info['to']}
- Duration: {call_info['duration']} seconds

Transcript:
{transcript_text}

Respond in JSON format:
{{
    "summary": "Brief 2-3 sentence summary",
    "sentiment": "positive|neutral|negative",
    "key_points": ["topic 1", "topic 2"],
    "action_items": ["action 1", "action 2"],
    "customer_intent": "Support Request|Sales Inquiry|General Question"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a call analysis assistant. Provide concise, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"AI summary error: {e}")
        return {
            "summary": "Unable to generate summary",
            "sentiment": "neutral",
            "key_points": [],
            "action_items": []
        }

def process_call(call):
    """Process a single call: download, transcribe, analyze"""
    cdr_id, tenant_id, recording_path, src, dst, duration, has_transcript = call

    logger.info(f"\n{'='*60}")
    logger.info(f"Processing Call #{cdr_id}: {src} -> {dst} ({duration}s)")
    logger.info(f"Recording path: {recording_path}")

    # Download recording from Supabase
    with tempfile.TemporaryDirectory() as temp_dir:
        local_file = os.path.join(temp_dir, f"call_{cdr_id}.wav")

        try:
            # Download file
            logger.info(f"Downloading recording from Supabase...")
            storage.download_recording(recording_path, local_file)

            if not os.path.exists(local_file):
                logger.error(f"Download failed - file not found at {local_file}")
                return False

            file_size = os.path.getsize(local_file)
            logger.info(f"Downloaded {file_size} bytes")

            # Transcribe if needed
            transcript_text = None
            if not has_transcript:
                logger.info("Transcribing audio...")
                transcript_text = transcribe_audio(local_file)
                if transcript_text:
                    save_transcript(cdr_id, transcript_text)
                    logger.info(f"Transcript saved ({len(transcript_text)} chars)")
                else:
                    logger.error("Transcription failed")
                    return False
            else:
                # Fetch existing transcript
                conn = psycopg2.connect(DATABASE_URL)
                cur = conn.cursor()
                cur.execute('SELECT transcript_text FROM transcriptions WHERE cdr_id = %s', (cdr_id,))
                result = cur.fetchone()
                conn.close()
                if result:
                    transcript_text = result[0]
                    logger.info(f"Using existing transcript ({len(transcript_text)} chars)")

            # Generate AI summary
            if transcript_text:
                logger.info("Generating AI summary...")
                call_info = {
                    'from': src,
                    'to': dst,
                    'duration': duration
                }
                summary = generate_ai_summary(transcript_text, call_info)
                save_ai_summary(cdr_id, summary)
                logger.info(f"AI summary saved: {summary.get('sentiment')} sentiment")

            return True

        except Exception as e:
            logger.error(f"Error processing call {cdr_id}: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    logger.info("Starting batch processing of recordings...")

    # Get calls to process
    calls = get_calls_needing_processing()
    logger.info(f"Found {len(calls)} calls with recordings")

    success_count = 0
    error_count = 0

    for i, call in enumerate(calls, 1):
        logger.info(f"\n[{i}/{len(calls)}] Processing call...")

        if process_call(call):
            success_count += 1
        else:
            error_count += 1

        # Progress update
        if i % 10 == 0:
            logger.info(f"\nProgress: {i}/{len(calls)} processed ({success_count} success, {error_count} errors)")

    logger.info(f"\n{'='*60}")
    logger.info(f"BATCH PROCESSING COMPLETE")
    logger.info(f"Total: {len(calls)} calls")
    logger.info(f"Success: {success_count}")
    logger.info(f"Errors: {error_count}")
    logger.info(f"{'='*60}\n")

if __name__ == '__main__':
    main()
