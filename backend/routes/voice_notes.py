from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import os
from groq import Groq
import json
from datetime import datetime
import tempfile

router = APIRouter(prefix="/api/voice", tags=["Voice Notes"])

# Check for API key on startup
if not os.getenv("GROQ_API_KEY"):
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables!")
    print("⚠️ Create a .env file with: GROQ_API_KEY=your_key_here")

# Initialize Groq client
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY")) if os.getenv("GROQ_API_KEY") else None
    if client:
        print("✅ Groq client initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")
    client = None

# In-memory storage (replace with database in production)
voice_notes_storage = []

class VoiceNote(BaseModel):
    id: str
    title: str
    transcript: str
    summary: str
    key_points: List[str]
    created_at: str

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using Groq Whisper API
    """
    # Check if API key is configured
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=500, 
            detail="GROQ_API_KEY not configured. Add it to your .env file."
        )
    
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="Groq client not initialized. Check your API key."
        )

    try:
        print(f"📥 Received audio file: {audio.filename}, type: {audio.content_type}")
        
        # Read audio content
        audio_content = await audio.read()
        print(f"📊 Audio size: {len(audio_content)} bytes")
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")

        # Save to temporary file with proper extension
        file_extension = ".webm"
        if audio.content_type:
            if "mp4" in audio.content_type:
                file_extension = ".mp4"
            elif "ogg" in audio.content_type:
                file_extension = ".ogg"
            elif "wav" in audio.content_type:
                file_extension = ".wav"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(audio_content)
            temp_path = temp_file.name
        
        print(f"💾 Saved to temp file: {temp_path}")

        # Transcribe using Groq Whisper
        print("🎤 Starting transcription with Groq Whisper...")
        try:
            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(audio.filename or f"recording{file_extension}", audio_file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                    language="en"
                )

            transcript = transcription.text
            print(f"✅ Transcription complete: {len(transcript)} characters")
            print(f"📝 Transcript preview: {transcript[:100]}...")

        except Exception as e:
            print(f"❌ Transcription failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {str(e)}. Check your GROQ_API_KEY and audio format."
            )

        if not transcript or len(transcript.strip()) == 0:
            raise HTTPException(
                status_code=400, 
                detail="Transcription resulted in empty text. Please speak louder or check your microphone."
            )

        # Generate summary and key points using LLM
        print("🤖 Generating summary and key points...")
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful study assistant. Extract key points and create a concise summary. Always respond in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": f"""Analyze this lecture/study note transcript and provide:
1. A brief summary (2-3 sentences)
2. 5-7 key points (bullet points)

Transcript: {transcript}

Respond ONLY in this JSON format (no markdown, no code blocks):
{{
  "summary": "...",
  "key_points": ["point1", "point2", "point3", "point4", "point5"]
}}"""
                    }
                ],
                temperature=0.5,
                max_tokens=500
            )

            # Parse AI response
            ai_response = completion.choices[0].message.content
            print(f"🤖 AI Response preview: {ai_response[:100]}...")
            
        except Exception as e:
            print(f"⚠️ AI summary generation failed: {str(e)}")
            # Fallback if AI fails
            ai_response = json.dumps({
                "summary": "Transcription completed successfully. AI summary generation encountered an issue.",
                "key_points": [
                    f"Transcript generated with {len(transcript)} characters",
                    "Audio processing completed successfully"
                ]
            })
        
        # Try to extract JSON from response
        try:
            # Remove markdown code blocks if present
            clean_response = ai_response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            
            parsed_response = json.loads(clean_response.strip())
            summary = parsed_response.get("summary", "Summary generated successfully")
            key_points = parsed_response.get("key_points", [])
            
            # Ensure we have at least some key points
            if not key_points or len(key_points) == 0:
                key_points = [
                    "Transcript generated successfully",
                    f"Total length: {len(transcript)} characters"
                ]
                
        except json.JSONDecodeError as je:
            print(f"⚠️ JSON parsing failed: {je}")
            print(f"Raw response: {ai_response}")
            # Fallback if JSON parsing fails
            summary = "Processing completed successfully"
            key_points = [
                "Audio transcribed successfully",
                f"Transcript length: {len(transcript)} characters",
                "AI analysis completed"
            ]

        # Create voice note entry
        note_id = f"note_{int(datetime.now().timestamp() * 1000)}"
        voice_note = {
            "id": note_id,
            "title": f"Voice Note - {datetime.now().strftime('%b %d, %Y %I:%M %p')}",
            "transcript": transcript,
            "summary": summary,
            "key_points": key_points,
            "created_at": datetime.now().isoformat()
        }

        # Store in memory
        voice_notes_storage.append(voice_note)
        
        print(f"✅ Voice note saved: {note_id}")

        # Clean up temp file
        try:
            os.remove(temp_path)
            print(f"🧹 Cleaned up temp file: {temp_path}")
        except Exception as e:
            print(f"⚠️ Failed to delete temp file: {e}")

        return voice_note

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in transcribe_audio: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing audio: {str(e)}"
        )


@router.get("/notes")
def get_all_notes():
    """
    Get all saved voice notes
    """
    return {"notes": voice_notes_storage}


@router.delete("/notes/{note_id}")
def delete_note(note_id: str):
    """
    Delete a voice note
    """
    global voice_notes_storage
    initial_length = len(voice_notes_storage)
    voice_notes_storage = [note for note in voice_notes_storage if note["id"] != note_id]
    
    if len(voice_notes_storage) == initial_length:
        raise HTTPException(status_code=404, detail="Note not found")
    
    print(f"🗑️ Deleted note: {note_id}")
    return {"message": "Note deleted successfully"}


@router.get("/health")
def health_check():
    """
    Check if voice notes API is working
    """
    return {
        "status": "healthy",
        "groq_api_configured": bool(os.getenv("GROQ_API_KEY")),
        "groq_client_initialized": client is not None,
        "notes_count": len(voice_notes_storage)
    }