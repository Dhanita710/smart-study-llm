import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudyPlanner.css";

export default function StudyPlanner() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generatePlan = async () => {
    // Clear previous error
    setError("");

    // Basic validation
    if (!subjects.trim()) {
      setError("Please enter at least one subject.");
      return;
    }

    try {
      setLoading(true);
      setPlan(""); // Clear old plan while loading

      // Convert "AI, DBMS, OS" -> ["AI", "DBMS", "OS"]
      const subjectArray = subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      console.log("Sending request with subjects:", subjectArray);

      // Make API request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/planner/generate",
        { subjects: subjectArray },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response received:", response.data);

      // Update state with the plan text from backend
      if (response.data && response.data.plan) {
        setPlan(response.data.plan);
      } else {
        setError("No plan received from server");
      }
    } catch (err) {
      console.error("Error generating plan:", err);
      
      // Detailed error messages
      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.detail || "Server error occurred";
        setError(`Error ${err.response.status}: ${errorMsg}`);
      } else if (err.request) {
        // Request made but no response
        setError("Cannot connect to server. Make sure backend is running on http://127.0.0.1:8000");
      } else {
        // Something else happened
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planner-container">
      {/* Back button */}
      <button 
        onClick={() => navigate("/dashboard")} 
        className="back-btn"
      >
        ← Back to Dashboard
      </button>

      <h2 className="planner-title">AI Study Planner 🎓</h2>
      <p className="planner-subtitle">
        Enter your subjects and let AI create a personalized 7-day study plan
      </p>

      <div className="planner-input-section">
        <input
          type="text"
          placeholder="Enter subjects (e.g., React, Python, DSA)"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && generatePlan()}
        />

        <button onClick={generatePlan} disabled={loading}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-box">
          ⚠️ {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>AI is creating your personalized study plan...</p>
        </div>
      )}

      {/* Results */}
      {plan && !loading && (
        <div className="planner-result">
          <h3>Your 7-Day Study Plan 📚</h3>
          <div className="plan-content">
            {plan.split('\n').map((line, i) => (
              <p key={i} className="plan-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}