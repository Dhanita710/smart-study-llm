import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // ALL 8 WORKING FEATURES
  const allFeatures = [
    {
      id: "planner",
      title: "AI Study Planner",
      subtitle: "Smart schedules",
      icon: "📚",
      gradient: "purple",
      path: "/study-planner",
    },
    {
      id: "chat",
      title: "AI Tutor",
      subtitle: "Instant help",
      icon: "💡",
      gradient: "blue",
      path: "/chat",
    },
    {
      id: "focus",
      title: "Focus Mode",
      subtitle: "Deep work",
      icon: "🎯",
      gradient: "orange",
      path: "/focus-mode",
    },
    {
      id: "progress",
      title: "Progress Tracker",
      subtitle: "Track growth",
      icon: "📈",
      gradient: "green",
      path: "/progress-tracker",
    },
    {
      id: "buddy",
      title: "Study Buddy",
      subtitle: "Find partners",
      icon: "👥",
      gradient: "pink",
      path: "/study-buddy",
    },
    {
      id: "voice",
      title: "Voice Notes",
      subtitle: "Record & summarize",
      icon: "🎤",
      gradient: "teal",
      path: "/voice-notes",
    },
    {
      id: "ambient",
      title: "Study Rooms",
      subtitle: "Virtual spaces",
      icon: "🌙",
      gradient: "indigo",
      path: "/study-rooms",
    },
    {
      id: "location",
      title: "Location Tracker",
      subtitle: "Best study spots",
      icon: "📍",
      gradient: "red",
      path: "/location-tracker",
    },
  ];

  const quickStats = [
    { emoji: "🔥", value: "7", label: "Day Streak" },
    { emoji: "⏱️", value: "24h", label: "Study Time" },
    { emoji: "✅", value: "47", label: "Completed" },
    { emoji: "🎯", value: "89%", label: "Progress" },
  ];

  return (
    <div className="dashboard-universe">
      {/* Header */}
      <header className="floating-header">
        <div className="header-left">
          <h1 className="brand-name">SmartStudy</h1>
          <p className="brand-tagline">AI Learning System</p>
        </div>

        <div className="header-center">
          <div className="time-capsule">
            <span className="time-value">{formatTime(currentTime)}</span>
            <span className="date-value">{formatDate(currentTime)}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-bubble">
            <div className="user-avatar-circle">
              {auth.currentUser?.email?.[0].toUpperCase()}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-universe">
        {/* Welcome Section */}
        <section className="hero-welcome">
          <h2 className="hero-greeting">
            Welcome back,{" "}
            <span className="hero-name">
              {auth.currentUser?.email?.split("@")[0]}
            </span>
            ! 👋
          </h2>
          <p className="hero-subtitle">
            Choose your tool and make progress today.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="quick-stats-bar">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-bubble">
              <span className="stat-emoji">{stat.emoji}</span>
              <div className="stat-info">
                <p className="stat-number">{stat.value}</p>
                <p className="stat-text">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* All Features Grid - 8 Cards */}
        <section className="features-section">
          <h3 className="section-title">Your Learning Tools</h3>
          <div className="all-features-grid">
            {allFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`feature-card gradient-${feature.gradient}`}
                onClick={() => navigate(feature.path)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-subtitle">{feature.subtitle}</p>
                <div className="card-arrow">→</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-dot purple"></div>
              <div className="activity-content">
                <p className="activity-title">Completed Focus Session</p>
                <p className="activity-time">2 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot blue"></div>
              <div className="activity-content">
                <p className="activity-title">Generated Study Plan</p>
                <p className="activity-time">5 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot green"></div>
              <div className="activity-content">
                <p className="activity-title">Reached 7-Day Streak</p>
                <p className="activity-time">Today</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Home Button */}
      <button className="fab" onClick={() => navigate("/")}>
        <span className="fab-icon">🏠</span>
      </button>
    </div>
  );
}

export default Dashboard;