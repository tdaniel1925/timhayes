"""
Test Complete Dual-Method Download Workflow
Tests UCM API direct download (primary) with Supabase fallback
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
print("Testing Complete Dual-Method Download Workflow")
print("=" * 70)
print()

with app.app_context():
    # Find a recent call with valid recordfiles field
    call = CDRRecord.query.filter(
        CDRRecord.recordfiles.isnot(None),
        CDRRecord.recordfiles != ''
    ).order_by(CDRRecord.id.desc()).first()

    if not call:
        print("❌ No calls with recordfiles found in database")
        sys.exit(1)

    print(f"📞 Testing with Call:")
    print(f"   Call ID: {call.id}")
    print(f"   UniqueID: {call.uniqueid}")
    print(f"   Recordfiles: {call.recordfiles}")
    print(f"   Storage Path: {call.recording_local_path}")
    print(f"   Tenant ID: {call.tenant_id}")
    print()

    print("=" * 70)
    print("Starting Dual-Method Download Test")
    print("=" * 70)
    print("Expected Flow:")
    print("  1. Try UCM API direct download (RECAPI) - Should get standard RIFF WAV")
    print("  2. If UCM API fails, fallback to Supabase download - May get GSFF")
    print("  3. Auto-convert GSFF to WAV if needed")
    print("  4. Convert to MP3 for OpenAI Whisper")
    print("  5. Transcribe with OpenAI")
    print("=" * 70)
    print()

    # This should now use the dual-method approach
    result = transcribe_audio(
        storage_path=call.recording_local_path,
        call_id=call.id,
        tenant_id=call.tenant_id
    )

    print()
    print("=" * 70)
    print("TEST RESULTS")
    print("=" * 70)
    if result:
        print("✅ SUCCESS! Transcription completed")
        print(f"   Transcription length: {len(result)} characters")
        print(f"   Preview: {result[:200]}...")
    else:
        print("❌ Transcription failed")
        print("   Check logs above for details:")
        print("   - Did UCM API download work?")
        print("   - Did fallback to Supabase work?")
        print("   - Was GSFF conversion needed?")
    print("=" * 70)
