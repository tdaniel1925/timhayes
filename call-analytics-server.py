#!/usr/bin/env python3
"""
Grandstream CloudUCM Call Recording Analytics Server
Receives CDR webhooks, downloads recordings, transcribes with AI, and performs sentiment analysis
"""

import os
import json
import logging
import hashlib
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, render_template_string
import sqlite3
import requests
from typing import Optional, Dict, Any
import threading
from urllib.parse import quote

# Optional AI imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

# Configuration from environment variables
CONFIG = {
    'UCM_IP': os.getenv('UCM_IP', '192.168.1.100'),
    'UCM_USERNAME': os.getenv('UCM_USERNAME', 'admin'),
    'UCM_PASSWORD': os.getenv('UCM_PASSWORD', 'password'),
    'UCM_HTTPS_PORT': int(os.getenv('UCM_HTTPS_PORT', '8089')),
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY', ''),
    'WEBHOOK_PORT': int(os.getenv('WEBHOOK_PORT', '5000')),
    'WEBHOOK_USERNAME': os.getenv('WEBHOOK_USERNAME', 'admin'),  # Match CloudUCM config
    'WEBHOOK_PASSWORD': os.getenv('WEBHOOK_PASSWORD', 'password'),  # Match CloudUCM config
    'RECORDING_DIR': os.getenv('RECORDING_DIR', './recordings'),
    'DB_PATH': os.getenv('DB_PATH', './call_analytics.db'),
    'TRANSCRIPTION_ENABLED': os.getenv('TRANSCRIPTION_ENABLED', 'false').lower() == 'true',
    'SENTIMENT_ENABLED': os.getenv('SENTIMENT_ENABLED', 'false').lower() == 'true',
}

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('call_analytics.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Ensure recording directory exists
Path(CONFIG['RECORDING_DIR']).mkdir(parents=True, exist_ok=True)


class DatabaseManager:
    """Manages SQLite database operations"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # CDR table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cdr_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uniqueid TEXT UNIQUE NOT NULL,
                src TEXT,
                dst TEXT,
                caller_name TEXT,
                clid TEXT,
                channel TEXT,
                dstchannel TEXT,
                start_time TEXT,
                answer_time TEXT,
                end_time TEXT,
                duration INTEGER,
                billsec INTEGER,
                disposition TEXT,
                recordfiles TEXT,
                src_trunk_name TEXT,
                dst_trunk_name TEXT,
                recording_downloaded BOOLEAN DEFAULT 0,
                recording_local_path TEXT,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Transcriptions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transcriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cdr_id INTEGER NOT NULL,
                uniqueid TEXT NOT NULL,
                transcription_text TEXT,
                language TEXT,
                duration_seconds REAL,
                transcribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cdr_id) REFERENCES cdr_records (id)
            )
        ''')

        # Sentiment analysis table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sentiment_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transcription_id INTEGER NOT NULL,
                sentiment TEXT,
                sentiment_score REAL,
                positive_score REAL,
                negative_score REAL,
                neutral_score REAL,
                key_phrases TEXT,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transcription_id) REFERENCES transcriptions (id)
            )
        ''')

        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

    def save_cdr(self, cdr_data: Dict) -> Optional[int]:
        """Save CDR record to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT OR REPLACE INTO cdr_records
                (uniqueid, src, dst, caller_name, clid, channel, dstchannel,
                 start_time, answer_time, end_time, duration, billsec, disposition,
                 recordfiles, src_trunk_name, dst_trunk_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                cdr_data.get('uniqueid'),
                cdr_data.get('src'),
                cdr_data.get('dst'),
                cdr_data.get('caller_name'),
                cdr_data.get('clid'),
                cdr_data.get('channel'),
                cdr_data.get('dstchannel'),
                cdr_data.get('start'),
                cdr_data.get('answer'),
                cdr_data.get('end'),
                cdr_data.get('duration'),
                cdr_data.get('billsec'),
                cdr_data.get('disposition'),
                cdr_data.get('recordfiles'),
                cdr_data.get('src_trunk_name'),
                cdr_data.get('dst_trunk_name')
            ))

            cdr_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(f"Saved CDR {cdr_data.get('uniqueid')} (ID: {cdr_id})")
            return cdr_id if cdr_id > 0 else self.get_cdr_id(cdr_data.get('uniqueid'))
        except Exception as e:
            logger.error(f"Error saving CDR: {e}")
            return None

    def get_cdr_id(self, uniqueid: str) -> Optional[int]:
        """Get CDR ID by uniqueid"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM cdr_records WHERE uniqueid = ?', (uniqueid,))
            result = cursor.fetchone()
            conn.close()
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting CDR ID: {e}")
            return None

    def update_recording_path(self, uniqueid: str, local_path: str):
        """Update local recording file path"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE cdr_records SET recording_downloaded = 1, recording_local_path = ? WHERE uniqueid = ?',
                (local_path, uniqueid)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error updating recording path: {e}")

    def save_transcription(self, cdr_id: int, uniqueid: str, transcription: str,
                          language: str = None, duration: float = None) -> Optional[int]:
        """Save transcription to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO transcriptions
                (cdr_id, uniqueid, transcription_text, language, duration_seconds)
                VALUES (?, ?, ?, ?, ?)
            ''', (cdr_id, uniqueid, transcription, language, duration))

            transcription_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(f"Saved transcription for {uniqueid} (ID: {transcription_id})")
            return transcription_id
        except Exception as e:
            logger.error(f"Error saving transcription: {e}")
            return None

    def save_sentiment(self, transcription_id: int, sentiment_data: Dict) -> bool:
        """Save sentiment analysis to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO sentiment_analysis
                (transcription_id, sentiment, sentiment_score, positive_score,
                 negative_score, neutral_score, key_phrases)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                transcription_id,
                sentiment_data.get('sentiment'),
                sentiment_data.get('sentiment_score'),
                sentiment_data.get('positive_score'),
                sentiment_data.get('negative_score'),
                sentiment_data.get('neutral_score'),
                json.dumps(sentiment_data.get('key_phrases', []))
            ))

            conn.commit()
            conn.close()

            logger.info(f"Saved sentiment for transcription {transcription_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving sentiment: {e}")
            return False

    def get_recent_calls(self, limit: int = 50):
        """Get recent calls with all associated data"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute('''
                SELECT
                    c.*,
                    t.transcription_text,
                    t.language,
                    s.sentiment,
                    s.sentiment_score
                FROM cdr_records c
                LEFT JOIN transcriptions t ON c.id = t.cdr_id
                LEFT JOIN sentiment_analysis s ON t.id = s.transcription_id
                ORDER BY c.received_at DESC
                LIMIT ?
            ''', (limit,))

            results = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Error getting recent calls: {e}")
            return []


class UCMRecordingDownloader:
    """Downloads recording files from Grandstream UCM via HTTPS API"""

    def __init__(self, ucm_ip: str, username: str, password: str, port: int = 8089):
        self.ucm_ip = ucm_ip
        self.username = username
        self.password = password
        self.port = port
        self.session = None
        self.authenticated = False

    def authenticate(self) -> bool:
        """Authenticate with UCM HTTPS API"""
        try:
            self.session = requests.Session()
            base_url = f"https://{self.ucm_ip}:{self.port}/api"

            # Step 1: Get challenge
            challenge_request = {
                "request": {
                    "action": "challenge",
                    "user": self.username,
                    "version": "1.0"
                }
            }

            response = self.session.post(base_url, json=challenge_request, verify=False, timeout=10)
            response.raise_for_status()
            challenge = response.json()['response']['challenge']

            # Step 2: Login with token
            token = hashlib.md5((challenge + self.password).encode()).hexdigest()
            login_request = {
                "request": {
                    "action": "login",
                    "token": token,
                    "user": self.username
                }
            }

            login_response = self.session.post(base_url, json=login_request, verify=False, timeout=10)
            login_response.raise_for_status()

            self.authenticated = True
            logger.info(f"Authenticated with UCM as {self.username}")
            return True

        except Exception as e:
            logger.error(f"UCM authentication failed: {e}")
            return False

    def download_recording(self, recording_path: str, uniqueid: str) -> Optional[str]:
        """Download recording file from UCM"""
        if not recording_path or recording_path == "":
            logger.info(f"No recording file for {uniqueid}")
            return None

        # Determine local filename
        filename = Path(recording_path).name
        local_path = os.path.join(CONFIG['RECORDING_DIR'], f"{uniqueid}_{filename}")

        # Check if already downloaded
        if os.path.exists(local_path):
            logger.info(f"Recording already exists: {local_path}")
            return local_path

        # Try direct HTTPS download (UCM may expose recordings via web interface)
        try:
            # Common UCM recording paths
            download_urls = [
                f"https://{self.ucm_ip}:{self.port}/recordings{recording_path}",
                f"https://{self.ucm_ip}:{self.port}{recording_path}",
                f"https://{self.ucm_ip}/cdrapi/recording?file={quote(recording_path)}"
            ]

            for url in download_urls:
                try:
                    logger.info(f"Attempting download from: {url}")
                    response = requests.get(
                        url,
                        auth=(self.username, self.password),
                        verify=False,
                        timeout=30
                    )

                    if response.status_code == 200 and len(response.content) > 1000:
                        with open(local_path, 'wb') as f:
                            f.write(response.content)
                        logger.info(f"Downloaded recording: {local_path}")
                        return local_path
                except Exception as e:
                    logger.debug(f"Download attempt failed for {url}: {e}")
                    continue

            logger.warning(f"Could not download recording from any URL: {recording_path}")
            return None

        except Exception as e:
            logger.error(f"Recording download failed: {e}")
            return None


class TranscriptionService:
    """Handles audio transcription using AI"""

    def __init__(self):
        if OPENAI_AVAILABLE and CONFIG['OPENAI_API_KEY']:
            openai.api_key = CONFIG['OPENAI_API_KEY']
            self.service = 'openai'
            logger.info("Transcription service: OpenAI Whisper API")
        else:
            self.service = None
            logger.warning("Transcription not available - set OPENAI_API_KEY or install local models")

    def transcribe(self, audio_file_path: str) -> Optional[Dict]:
        """Transcribe audio file"""
        if not os.path.exists(audio_file_path):
            logger.error(f"Audio file not found: {audio_file_path}")
            return None

        if self.service == 'openai':
            return self.transcribe_openai(audio_file_path)
        else:
            logger.warning("No transcription service available")
            return None

    def transcribe_openai(self, audio_file_path: str) -> Optional[Dict]:
        """Transcribe using OpenAI Whisper API"""
        try:
            with open(audio_file_path, 'rb') as audio_file:
                transcript = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json"
                )

            return {
                'text': transcript.text,
                'language': getattr(transcript, 'language', None),
                'duration': getattr(transcript, 'duration', None)
            }
        except Exception as e:
            logger.error(f"OpenAI transcription failed: {e}")
            return None


class SentimentAnalyzer:
    """Performs sentiment analysis on text"""

    def __init__(self):
        if TRANSFORMERS_AVAILABLE:
            try:
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english"
                )
                self.available = True
                logger.info("Sentiment analysis: Loaded DistilBERT model")
            except Exception as e:
                logger.error(f"Failed to load sentiment model: {e}")
                self.available = False
        else:
            self.available = False
            logger.warning("Sentiment analysis not available - install transformers and torch")

    def analyze(self, text: str) -> Optional[Dict]:
        """Analyze sentiment of text"""
        if not self.available or not text:
            return None

        try:
            # Truncate to model's max length
            text_sample = text[:512]
            result = self.sentiment_pipeline(text_sample)[0]

            sentiment_data = {
                'sentiment': result['label'],
                'sentiment_score': result['score'],
                'positive_score': result['score'] if result['label'] == 'POSITIVE' else 1 - result['score'],
                'negative_score': result['score'] if result['label'] == 'NEGATIVE' else 1 - result['score'],
                'neutral_score': 0.0,
                'key_phrases': self.extract_key_phrases(text)
            }

            logger.info(f"Sentiment: {sentiment_data['sentiment']} ({sentiment_data['sentiment_score']:.2f})")
            return sentiment_data

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return None

    def extract_key_phrases(self, text: str) -> list:
        """Extract key phrases from text"""
        from collections import Counter
        words = text.lower().split()
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'was', 'are', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        filtered_words = [w for w in words if w not in stop_words and len(w) > 3]
        word_freq = Counter(filtered_words)
        return [word for word, count in word_freq.most_common(10)]


# Initialize services
db_manager = DatabaseManager(CONFIG['DB_PATH'])
downloader = UCMRecordingDownloader(
    CONFIG['UCM_IP'],
    CONFIG['UCM_USERNAME'],
    CONFIG['UCM_PASSWORD'],
    CONFIG['UCM_HTTPS_PORT']
)
transcription_service = TranscriptionService() if CONFIG['TRANSCRIPTION_ENABLED'] else None
sentiment_analyzer = SentimentAnalyzer() if CONFIG['SENTIMENT_ENABLED'] else None


def process_call_recording_async(cdr_data: Dict):
    """Process call recording in background"""
    uniqueid = cdr_data.get('uniqueid')
    recording_path = cdr_data.get('recordfiles')

    logger.info(f"Processing recording for {uniqueid}")

    # Step 1: Download recording
    if not downloader.authenticated:
        if not downloader.authenticate():
            logger.error("Failed to authenticate with UCM")
            return

    local_file = downloader.download_recording(recording_path, uniqueid)
    if not local_file:
        logger.warning(f"Could not download recording for {uniqueid}")
        return

    db_manager.update_recording_path(uniqueid, local_file)

    # Step 2: Transcribe (if enabled)
    if transcription_service:
        transcription_result = transcription_service.transcribe(local_file)
        if transcription_result:
            cdr_id = db_manager.get_cdr_id(uniqueid)
            transcription_id = db_manager.save_transcription(
                cdr_id,
                uniqueid,
                transcription_result['text'],
                transcription_result.get('language'),
                transcription_result.get('duration')
            )

            # Step 3: Sentiment analysis (if enabled)
            if sentiment_analyzer and transcription_id:
                sentiment_result = sentiment_analyzer.analyze(transcription_result['text'])
                if sentiment_result:
                    db_manager.save_sentiment(transcription_id, sentiment_result)

    logger.info(f"Completed processing for {uniqueid}")


@app.route('/cdr', methods=['POST'])
def receive_cdr():
    """Webhook endpoint to receive CDR data from CloudUCM"""
    try:
        # Basic authentication (match CloudUCM config)
        auth = request.authorization
        if not auth or auth.username != CONFIG['WEBHOOK_USERNAME'] or auth.password != CONFIG['WEBHOOK_PASSWORD']:
            logger.warning(f"Unauthorized CDR webhook attempt")
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        # Parse CDR data
        if request.is_json:
            cdr_data = request.get_json()
        else:
            cdr_data = json.loads(request.data.decode('utf-8'))

        uniqueid = cdr_data.get('uniqueid', 'unknown')
        logger.info(f"Received CDR: {uniqueid} | {cdr_data.get('src')} -> {cdr_data.get('dst')} | {cdr_data.get('disposition')}")

        # Save to database
        cdr_id = db_manager.save_cdr(cdr_data)
        if not cdr_id:
            return jsonify({"status": "error", "message": "Failed to save CDR"}), 500

        # Process recording in background thread
        if cdr_data.get('disposition') == 'ANSWERED' and cdr_data.get('recordfiles'):
            thread = threading.Thread(target=process_call_recording_async, args=(cdr_data,))
            thread.daemon = True
            thread.start()

        return jsonify({"status": "success", "message": "CDR received"}), 200

    except Exception as e:
        logger.error(f"Error processing CDR: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "transcription": transcription_service.service if transcription_service else "disabled",
        "sentiment": "enabled" if sentiment_analyzer and sentiment_analyzer.available else "disabled"
    }), 200


@app.route('/stats', methods=['GET'])
def get_stats():
    """Get statistics"""
    try:
        conn = sqlite3.connect(CONFIG['DB_PATH'])
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM cdr_records')
        total_cdrs = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM cdr_records WHERE recording_downloaded = 1')
        downloaded = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM transcriptions')
        transcriptions = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM sentiment_analysis')
        sentiments = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            "total_cdrs": total_cdrs,
            "recordings_downloaded": downloaded,
            "transcriptions": transcriptions,
            "sentiment_analyses": sentiments
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def dashboard():
    """Simple web dashboard"""
    calls = db_manager.get_recent_calls(50)

    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Call Analytics Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            h1 { color: #333; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-card h3 { margin: 0; color: #666; font-size: 14px; }
            .stat-card .number { font-size: 32px; font-weight: bold; color: #2196F3; margin: 10px 0; }
            table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th { background: #2196F3; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #ddd; }
            tr:hover { background: #f5f5f5; }
            .positive { color: #4CAF50; font-weight: bold; }
            .negative { color: #f44336; font-weight: bold; }
            .transcription { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        </style>
        <script>
            setTimeout(() => location.reload(), 30000);  // Auto-refresh every 30s
        </script>
    </head>
    <body>
        <h1>📞 Call Analytics Dashboard</h1>
        <div class="stats">
            <div class="stat-card">
                <h3>Total Calls</h3>
                <div class="number" id="total">0</div>
            </div>
            <div class="stat-card">
                <h3>Recordings Downloaded</h3>
                <div class="number" id="recordings">0</div>
            </div>
            <div class="stat-card">
                <h3>Transcriptions</h3>
                <div class="number" id="transcriptions">0</div>
            </div>
            <div class="stat-card">
                <h3>Sentiment Analyses</h3>
                <div class="number" id="sentiments">0</div>
            </div>
        </div>
        <h2>Recent Calls</h2>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Transcription</th>
                    <th>Sentiment</th>
                </tr>
            </thead>
            <tbody>
                {% for call in calls %}
                <tr>
                    <td>{{ call.start_time }}</td>
                    <td>{{ call.src }} {% if call.caller_name %}<br><small>{{ call.caller_name }}</small>{% endif %}</td>
                    <td>{{ call.dst }}</td>
                    <td>{{ call.duration }}s</td>
                    <td>{{ call.disposition }}</td>
                    <td class="transcription">{{ call.transcription_text or '-' }}</td>
                    <td>
                        {% if call.sentiment %}
                            <span class="{{ 'positive' if call.sentiment == 'POSITIVE' else 'negative' }}">
                                {{ call.sentiment }} ({{ "%.2f"|format(call.sentiment_score) }})
                            </span>
                        {% else %}
                            -
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        <script>
            fetch('/stats')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('total').textContent = data.total_cdrs;
                    document.getElementById('recordings').textContent = data.recordings_downloaded;
                    document.getElementById('transcriptions').textContent = data.transcriptions;
                    document.getElementById('sentiments').textContent = data.sentiment_analyses;
                });
        </script>
    </body>
    </html>
    """
    return render_template_string(html, calls=calls)


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting Grandstream Call Analytics Server")
    logger.info("=" * 60)
    logger.info(f"UCM IP: {CONFIG['UCM_IP']}")
    logger.info(f"Webhook Port: {CONFIG['WEBHOOK_PORT']}")
    logger.info(f"Transcription: {'Enabled' if CONFIG['TRANSCRIPTION_ENABLED'] else 'Disabled'}")
    logger.info(f"Sentiment Analysis: {'Enabled' if CONFIG['SENTIMENT_ENABLED'] else 'Disabled'}")
    logger.info("=" * 60)

    # Disable SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    app.run(
        host='0.0.0.0',
        port=CONFIG['WEBHOOK_PORT'],
        debug=False
    )
