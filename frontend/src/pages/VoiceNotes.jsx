import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VoiceNotes.css";

// ✅ FIXED: Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

console.log("🔧 API Base URL:", API_BASE_URL); // Debug log

export default function VoiceNotes() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [savedNotes, setSavedNotes] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported MIME types
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }
      
      console.log("🎤 Using MIME type:", mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("📊 Audio chunk received:", event.data.size, "bytes");
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("✅ Recording stopped. Total size:", audioBlob.size, "bytes");
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("🔴 Recording started");
    } catch (error) {
      alert("❌ Please allow microphone access!");
      console.error("Microphone error:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("⏹️ Stopping recording...");
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log("🔍 Testing backend connection at:", `${API_BASE_URL}/health`);
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      console.log("✅ Backend is reachable:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Backend connection failed:", error);
      return false;
    }
  };

  // Process and transcribe audio
  const processAudio = async () => {
    if (!audioBlob) {
      alert("Please record audio first!");
      return;
    }

    if (audioBlob.size === 0) {
      alert("❌ Recording is empty. Please try recording again.");
      return;
    }

    console.log("📦 Audio blob size:", audioBlob.size, "bytes");
    console.log("📦 Audio blob type:", audioBlob.type);

    // Test backend connection first
    const isBackendReachable = await testBackendConnection();
    if (!isBackendReachable) {
      alert(
        `❌ Cannot connect to backend server!\n\n` +
        `Expected URL: ${API_BASE_URL}\n\n` +
        `Troubleshooting:\n` +
        `1. Make sure backend is running: cd backend && python main.py\n` +
        `2. Check if http://localhost:8000/health works in your browser\n` +
        `3. Verify CORS is enabled in backend\n` +
        `4. Check for firewall/antivirus blocking port 8000`
      );
      return;
    }

    setProcessing(true);
    setCurrentNote(null);

    try {
      const formData = new FormData();
      
      // Determine file extension based on MIME type
      let filename = "recording.webm";
      if (audioBlob.type.includes("mp4")) {
        filename = "recording.mp4";
      } else if (audioBlob.type.includes("ogg")) {
        filename = "recording.ogg";
      } else if (audioBlob.type.includes("wav")) {
        filename = "recording.wav";
      }
      
      formData.append("audio", audioBlob, filename);

      console.log("🚀 Sending audio to:", `${API_BASE_URL}/api/voice/transcribe`);
      console.log("📤 File name:", filename);
      console.log("📤 File size:", audioBlob.size, "bytes");

      const response = await axios.post(
        `${API_BASE_URL}/api/voice/transcribe`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 second timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log("⬆️ Upload progress:", percentCompleted + "%");
          }
        }
      );

      console.log("✅ Response received:", response.data);
      setCurrentNote(response.data);
      alert("✅ Processing complete!");
    } catch (error) {
      console.error("❌ Error details:", error);
      
      let errorMsg = "Failed to process audio";
      let troubleshooting = "";
      
      if (error.response) {
        // Server responded with error
        errorMsg = error.response.data?.detail || error.response.statusText;
        console.error("Server error:", error.response.status, error.response.data);
        
        if (error.response.status === 500) {
          troubleshooting = "\n\nPossible causes:\n" +
            "• GROQ_API_KEY not set in backend .env file\n" +
            "• Invalid GROQ_API_KEY\n" +
            "• Audio format not supported\n" +
            "• Check backend console logs for details";
        }
      } else if (error.request) {
        // Request was made but no response
        errorMsg = `Cannot connect to backend server at ${API_BASE_URL}`;
        console.error("No response from server");
        console.error("Request was made to:", error.config?.url);
        
        troubleshooting = "\n\nTroubleshooting:\n" +
          "1. Start backend: cd backend && python main.py\n" +
          "2. Check if backend is running: http://localhost:8000/health\n" +
          "3. Verify backend is on port 8000 (check terminal output)\n" +
          "4. Check for CORS errors in browser console (F12)\n" +
          "5. Try accessing backend directly in browser\n" +
          "6. Check firewall/antivirus settings";
      } else {
        // Something else happened
        errorMsg = error.message;
        troubleshooting = "\n\nCheck browser console for more details (Press F12)";
      }
      
      alert(`❌ Error: ${errorMsg}${troubleshooting}`);
    } finally {
      setProcessing(false);
    }
  };

  // Save note to library
  const saveNote = () => {
    if (currentNote) {
      setSavedNotes([currentNote, ...savedNotes]);
      setCurrentNote(null);
      setAudioBlob(null);
      alert("💾 Note saved!");
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/voice/notes/${noteId}`);
      setSavedNotes(savedNotes.filter(note => note.id !== noteId));
      alert("🗑️ Note deleted!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete note");
    }
  };

  return (
    <div className="voice-notes-container">
      <button onClick={() => navigate("/dashboard")} className="back-btn-voice">
        ← Back to Dashboard
      </button>

      <div className="voice-notes-content">
        <h1 className="voice-title">🎤 Voice Notes</h1>
        <p className="voice-subtitle">
          Record your lectures and get AI-powered summaries instantly
        </p>

        {/* Backend Status Indicator */}
        <div style={{
          padding: "8px 16px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "14px",
          fontFamily: "monospace"
        }}>
          📡 Backend: <strong>{API_BASE_URL}</strong>
        </div>

        {/* Recording Section */}
        <div className="recording-card">
          <div className={`mic-visualizer ${isRecording ? 'recording' : ''}`}>
            <div className="mic-icon">🎤</div>
            {isRecording && (
              <div className="pulse-rings">
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
              </div>
            )}
          </div>

          <div className="recording-controls">
            {!isRecording ? (
              <button onClick={startRecording} className="record-btn">
                ● Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="stop-btn">
                ■ Stop Recording
              </button>
            )}

            {audioBlob && !isRecording && (
              <button
                onClick={processAudio}
                disabled={processing}
                className="process-btn"
              >
                {processing ? "⏳ Processing..." : "✨ Transcribe & Summarize"}
              </button>
            )}
          </div>

          {isRecording && (
            <p className="recording-status">🔴 Recording...</p>
          )}

          {audioBlob && !isRecording && (
            <p className="recording-status">
              ✅ Recording ready ({Math.round(audioBlob.size / 1024)} KB)
            </p>
          )}
        </div>

        {/* Processing */}
        {processing && (
          <div className="processing-card">
            <div className="spinner"></div>
            <p>AI is transcribing and analyzing...</p>
            <p style={{ fontSize: "14px", color: "#666" }}>This may take 10-30 seconds</p>
          </div>
        )}

        {/* Current Result */}
        {currentNote && !processing && (
          <div className="result-card">
            <h3>📝 Transcription</h3>
            <div className="transcription-box">
              {currentNote.transcript}
            </div>

            <h3>📋 Summary</h3>
            <p className="summary-text">{currentNote.summary}</p>

            <h3>🔑 Key Points</h3>
            <ul className="key-points-list">
              {currentNote.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>

            <button onClick={saveNote} className="save-btn">
              💾 Save to Library
            </button>
          </div>
        )}

        {/* Saved Notes */}
        {savedNotes.length > 0 && (
          <div className="saved-section">
            <h3 className="saved-title">
              📚 Saved Notes ({savedNotes.length})
            </h3>
            <div className="notes-grid">
              {savedNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <h4>{note.title}</h4>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="note-summary">{note.summary}</p>

                  <div className="note-points">
                    {note.key_points.slice(0, 3).map((point, idx) => (
                      <span key={idx} className="point-badge">
                        • {point.length > 40 ? point.substring(0, 40) + "..." : point}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions-card">
          <h4>💡 How to Use</h4>
          <ol>
            <li>Click "Start Recording" and speak</li>
            <li>Click "Stop Recording" when done</li>
            <li>Click "Transcribe & Summarize"</li>
            <li>AI will generate transcript + summary + key points</li>
            <li>Save to your library for future reference</li>
          </ol>
          <p className="tech-note">
            ⚡ Powered by Groq Whisper API for ultra-fast transcription
          </p>
        </div>
      </div>
    </div>
  );
}