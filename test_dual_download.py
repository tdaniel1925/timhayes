"""
Test Dual Download Method: UCM API (Primary) + Supabase (Fallback)
"""
import os
import sys
import codecs
from dotenv import load_dotenv
from app import app, db, CDRRecord, transcribe_audio

# Fix encoding
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

print("=" * 70)
print("Testing Dual Download Method")
print("=" * 70)
print()

with app.app_context():
    # Find a recent call with recording
    call = CDRRecord.query.filter(
        CDRRecord.recordfiles.isnot(None)
    ).order_by(CDRRecord.id.desc()).first()

    if not call:
        print("❌ No calls with recordings found in database")
        sys.exit(1)

    print(f"Testing with Call ID: {call.id}")
    print(f"UniqueID: {call.uniqueid}")
    print(f"Recordfiles: {call.recordfiles}")
    print(f"Storage Path: {call.recording_local_path}")
    print(f"Tenant ID: {call.tenant_id}")
    print()

    print("=" * 70)
    print("Attempting transcription (will try UCM API first, then fallback)")
    print("=" * 70)
    print()

    # This should now:
    # 1. Try UCM API direct download (standard WAV)
    # 2. If that fails, download from Supabase (GSFF)
    # 3. Convert GSFF to WAV if needed
    # 4. Convert to MP3
    # 5. Transcribe with OpenAI

    result = transcribe_audio(
        storage_path=call.recording_local_path,
        call_id=call.id,
        tenant_id=call.tenant_id
    )

    print()
    print("=" * 70)
    if result:
        print("✅ SUCCESS! Transcription completed")
        print(f"Transcription length: {len(result)} characters")
        print(f"Preview: {result[:200]}...")
    else:
        print("❌ Transcription failed")
        print("Check logs above for details on which method was attempted")
    print("=" * 70)
