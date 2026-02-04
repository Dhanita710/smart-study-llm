import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Hero from "./components/Hero";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import StudyPlanner from "./components/StudyPlanner";
import ChatAssistant from "./pages/ChatAssistant";
import FocusMode from "./components/FocusMode";
import ProgressTracker from "./components/ProgressTracker";
import StudyBuddy from "./components/StudyBuddy";
import VoiceNotes from "./pages/VoiceNotes";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "22px",
        background: "radial-gradient(circle at top, #1e1b4b, #020617)",
        color: "white"
      }}>
        🔄 Checking authentication...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hero />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" /> : <Signup />}
        />

        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* ✅ Study Planner Route */}
        <Route
          path="/study-planner"
          element={user ? <StudyPlanner /> : <Navigate to="/login" />}
        />

        {/* ✅ Chat Assistant Route */}
        <Route
          path="/chat"
          element={user ? <ChatAssistant /> : <Navigate to="/login" />}
        />

        {/* ✅ Focus Mode Route */}
        <Route
          path="/focus-mode"
          element={user ? <FocusMode /> : <Navigate to="/login" />}
        />

        {/* ✅ Progress Tracker Route */}
        <Route
          path="/progress-tracker"
          element={user ? <ProgressTracker /> : <Navigate to="/login" />}
        />

        {/* ✅ Study Buddy Route */}
        <Route
          path="/study-buddy"
          element={user ? <StudyBuddy /> : <Navigate to="/login" />}
        />

        {/* ✅ Voice Notes Route - THIS WAS MISSING! */}
        <Route
          path="/voice-notes"
          element={user ? <VoiceNotes /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;