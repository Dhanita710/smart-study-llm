from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
from groq import Groq

router = APIRouter(prefix="/api/planner", tags=["Planner"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class StudyRequest(BaseModel):
    subjects: List[str]

@router.post("/generate")
def generate_plan(data: StudyRequest):

    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found")

    prompt = f"""
Create a simple 7-day study plan.
Subjects: {', '.join(data.subjects)}

Give day-wise plan in bullet points.
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Updated to supported model
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=400
        )

        return {
            "plan": completion.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))