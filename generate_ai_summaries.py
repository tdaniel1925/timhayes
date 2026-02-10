"""
Generate AI summaries from existing transcripts
"""
import os
import sys
import psycopg2
from openai import OpenAI
import logging
import json

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

def get_transcripts_needing_summaries():
    """Get all transcripts that don't have AI summaries yet"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute('''
        SELECT t.id, t.cdr_id, t.transcription_text, c.src, c.dst, c.duration
        FROM transcriptions t
        JOIN cdr_records c ON t.cdr_id = c.id
        LEFT JOIN ai_summaries a ON t.cdr_id = a.cdr_id
        WHERE c.tenant_id = 1 AND a.id IS NULL
        ORDER BY t.id DESC
    ''')

    transcripts = cur.fetchall()
    conn.close()
    return transcripts

def save_ai_summary(cdr_id, summary_data):
    """Save AI summary to database"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    summary_text = summary_data.get('summary', '')
    topics = '\n'.join(summary_data.get('key_points', []))
    action_items = '\n'.join(summary_data.get('action_items', []))
    customer_intent = summary_data.get('customer_intent', 'Unknown')
    call_outcome = summary_data.get('sentiment', 'neutral')

    # Insert new summary
    cur.execute('''
        INSERT INTO ai_summaries (cdr_id, summary_text, topics, action_items,
                                customer_intent, call_outcome, generated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
    ''', (cdr_id, summary_text, topics, action_items, customer_intent, call_outcome))

    conn.commit()
    conn.close()
    logger.info(f"✓ Saved AI summary for CDR {cdr_id}")

def generate_ai_summary(transcript_text, call_info):
    """Generate AI summary from transcript"""
    try:
        prompt = f"""Analyze this phone call transcript and provide:
1. A brief summary (2-3 sentences)
2. Sentiment (positive/neutral/negative)
3. Key points/topics discussed (3-5 bullet points)
4. Action items (if any)
5. Customer intent (e.g., "Support Request", "Sales Inquiry", "General Question", "Follow-up")

Call details:
- From: {call_info['from']}
- To: {call_info['to']}
- Duration: {call_info['duration']} seconds

Transcript:
{transcript_text[:3000]}

Respond in JSON format:
{{
    "summary": "Brief 2-3 sentence summary",
    "sentiment": "positive|neutral|negative",
    "key_points": ["topic 1", "topic 2", "topic 3"],
    "action_items": ["action 1", "action 2"],
    "customer_intent": "Support Request|Sales Inquiry|General Question|Follow-up"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a call analysis assistant. Provide concise, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"AI summary error: {e}")
        return {
            "summary": "Unable to generate summary",
            "sentiment": "neutral",
            "key_points": [],
            "action_items": [],
            "customer_intent": "Unknown"
        }

def process_transcript(transcript):
    """Process a single transcript and generate AI summary"""
    trans_id, cdr_id, text, src, dst, duration = transcript

    logger.info(f"Processing CDR #{cdr_id}: {src} -> {dst} ({duration}s)")
    logger.info(f"  Transcript length: {len(text)} characters")

    # Generate AI summary
    call_info = {
        'from': src,
        'to': dst,
        'duration': duration
    }

    summary = generate_ai_summary(text, call_info)
    save_ai_summary(cdr_id, summary)

    logger.info(f"  Summary: {summary.get('summary', '')[:100]}...")
    logger.info(f"  Sentiment: {summary.get('sentiment')}")
    logger.info(f"  Intent: {summary.get('customer_intent')}")
    logger.info("")

    return True

def main():
    logger.info("=" * 70)
    logger.info("GENERATING AI SUMMARIES FROM EXISTING TRANSCRIPTS")
    logger.info("=" * 70)
    logger.info("")

    # Get transcripts without summaries
    transcripts = get_transcripts_needing_summaries()
    logger.info(f"Found {len(transcripts)} transcripts needing AI summaries\n")

    if len(transcripts) == 0:
        logger.info("All transcripts already have AI summaries!")
        return

    success_count = 0
    error_count = 0

    for i, transcript in enumerate(transcripts, 1):
        logger.info(f"[{i}/{len(transcripts)}] {'=' * 50}")

        try:
            if process_transcript(transcript):
                success_count += 1
            else:
                error_count += 1
        except Exception as e:
            logger.error(f"Error processing transcript: {e}")
            error_count += 1

    logger.info("=" * 70)
    logger.info("SUMMARY GENERATION COMPLETE")
    logger.info(f"  Total: {len(transcripts)}")
    logger.info(f"  Success: {success_count}")
    logger.info(f"  Errors: {error_count}")
    logger.info("=" * 70)

if __name__ == '__main__':
    main()
