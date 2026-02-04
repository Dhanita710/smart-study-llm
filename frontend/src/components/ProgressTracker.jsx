import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProgressTracker.css";

export default function ProgressTracker() {
  const navigate = useNavigate();

  // Sample data - in a real app, this would come from a database
  const [subjects, setSubjects] = useState([
    { name: "React", progress: 75, hours: 24, lastStudied: "2 hours ago" },
    { name: "Python", progress: 60, hours: 18, lastStudied: "1 day ago" },
    { name: "DSA", progress: 45, hours: 12, lastStudied: "3 days ago" },
  ]);

  const [weeklyGoal] = useState(20); // hours per week
  const [weeklyProgress] = useState(14); // hours completed this week

  const getProgressColor = (progress) => {
    if (progress >= 70) return "#10b981"; // green
    if (progress >= 40) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const totalHours = subjects.reduce((sum, subject) => sum + subject.hours, 0);

  return (
    <div className="tracker-container">
      <button onClick={() => navigate("/dashboard")} className="back-btn">
        ← Back to Dashboard
      </button>

      <div className="tracker-content">
        <h1 className="tracker-title">📊 Progress Tracker</h1>
        <p className="tracker-subtitle">
          Track your learning journey and stay motivated
        </p>

        {/* Weekly Goal */}
        <div className="weekly-goal-card">
          <h3>🎯 Weekly Goal</h3>
          <div className="goal-progress">
            <div className="goal-info">
              <span className="goal-current">{weeklyProgress}h</span>
              <span className="goal-separator">/</span>
              <span className="goal-target">{weeklyGoal}h</span>
            </div>
            <div className="goal-bar">
              <div 
                className="goal-bar-fill"
                style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
              />
            </div>
            <p className="goal-status">
              {weeklyProgress >= weeklyGoal 
                ? "🎉 Goal achieved! Keep it up!" 
                : `${weeklyGoal - weeklyProgress} hours to go this week`}
            </p>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{subjects.length}</div>
            <div className="stat-label">Active Subjects</div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{totalHours}</div>
            <div className="stat-label">Total Hours</div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">7</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        {/* Subject Progress */}
        <div className="subjects-section">
          <h3>Subject Progress</h3>
          
          <div className="subjects-list">
            {subjects.map((subject, index) => (
              <div key={index} className="subject-card">
                <div className="subject-header">
                  <h4>{subject.name}</h4>
                  <span className="subject-hours">{subject.hours}h</span>
                </div>
                
                <div className="subject-progress-bar">
                  <div 
                    className="subject-progress-fill"
                    style={{ 
                      width: `${subject.progress}%`,
                      backgroundColor: getProgressColor(subject.progress)
                    }}
                  />
                </div>
                
                <div className="subject-footer">
                  <span className="subject-percent">{subject.progress}% Complete</span>
                  <span className="subject-last">Last studied: {subject.lastStudied}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="coming-soon-section">
          <h3>🚧 Coming Soon</h3>
          <div className="coming-soon-grid">
            <div className="coming-soon-card">
              <div className="icon">📈</div>
              <h4>Detailed Analytics</h4>
              <p>Charts and graphs of your progress over time</p>
            </div>
            
            <div className="coming-soon-card">
              <div className="icon">🏆</div>
              <h4>Achievements</h4>
              <p>Unlock badges and milestones</p>
            </div>
            
            <div className="coming-soon-card">
              <div className="icon">📅</div>
              <h4>Study Calendar</h4>
              <p>Visual calendar of your study sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}