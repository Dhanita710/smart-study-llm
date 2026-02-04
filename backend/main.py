from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
import json

# Load environment variables FIRST
load_dotenv()

print("=" * 60)
print("🚀 STARTING SMARTSTUDY BACKEND")
print("=" * 60)

# ✅ Initialize Firebase with environment variable or service account key
if not firebase_admin._apps:
    try:
        # Try to load from environment variable first (for Render)
        firebase_creds = os.getenv("FIREBASE_SERVICE_ACCOUNT")
        
        if firebase_creds:
            # Parse JSON from environment variable
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from environment variable!")
        else:
            # Fallback to file (for local development)
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from service account file!")
    except Exception as e:
        print(f"⚠️  Firebase initialization failed: {e}")
        print("⚠️  Make sure FIREBASE_SERVICE_ACCOUNT env var is set or serviceAccountKey.json exists")

# Create FastAPI app
app = FastAPI(
    title="SmartStudy API",
    version="1.0.0",
    description="AI-Powered Study Assistant Backend"
)

# ✅ CORS Configuration - Allow your Vercel domain + localhost
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    # Add your Vercel domains here
    "https://*.vercel.app",
    "https://your-app-name.vercel.app",  # Replace with your actual Vercel URL
]

# For development, you can use "*" but it's not recommended for production
# If you want to allow all origins in development, check environment
if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS = ["*"]
    print("⚠️  DEVELOPMENT MODE: Allowing ALL origins")
else:
    print(f"✅ CORS configured for specific origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Import routes AFTER CORS is configured
try:
    from routes.planner import router as planner_router
    from routes.study_buddy import router as study_buddy_router
    from routes.voice_notes import router as voice_notes_router
    
    app.include_router(planner_router)
    app.include_router(study_buddy_router)
    app.include_router(voice_notes_router)
    print("✅ All routes loaded successfully")
except Exception as e:
    print(f"⚠️  Error loading routes: {e}")

# Check required environment variables
required_vars = ["GROQ_API_KEY"]
for var in required_vars:
    if os.getenv(var):
        print(f"✅ {var} found in environment")
    else:
        print(f"❌ {var} NOT FOUND - Some features may not work!")

@app.get("/")
def read_root():
    return {
        "message": "SmartStudy API is running! 🚀",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "voice_transcribe": "/api/voice/transcribe",
            "voice_health": "/api/voice/health",
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "firebase": "initialized" if firebase_admin._apps else "not initialized",
        "groq_api_configured": bool(os.getenv("GROQ_API_KEY")),
        "environment": os.getenv("ENVIRONMENT", "production"),
        "routes": ["planner", "study_buddy", "voice_notes"]
    }

@app.get("/test-cors")
def test_cors():
    """Simple endpoint to test if CORS is working"""
    return {
        "message": "CORS is working!",
        "cors_enabled": True,
        "test": "success",
        "environment": os.getenv("ENVIRONMENT", "production")
    }

print("=" * 60)
print("📍 Backend server ready!")
print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'production')}")
print("📚 Docs: /docs")
print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment (Render sets this) or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )