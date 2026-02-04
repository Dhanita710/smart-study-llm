import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./FocusMode.css";

export default function FocusMode() {
  const navigate = useNavigate();
  
  // Timer states
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // Settings
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef(null);

  // Timer logic - FIXED: Added missing dependencies
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 0) {
            setMinutes((prevMinutes) => {
              if (prevMinutes === 0) {
                // Timer completed
                handleTimerComplete();
                return prevMinutes;
              }
              return prevMinutes - 1;
            });
            return 59;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive]); // Only depend on isActive

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (!isBreak) {
      // Focus session completed
      setSessionsCompleted(prev => prev + 1);
      alert("🎉 Focus session completed! Time for a break!");
      
      // Auto-start break
      setIsBreak(true);
      setMinutes(breakTime);
      setSeconds(0);
      setIsActive(true);
    } else {
      // Break completed
      alert("✨ Break is over! Ready for another focus session?");
      
      // Reset to focus session
      setIsBreak(false);
      setMinutes(focusTime);
      setSeconds(0);
    }
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  // FIXED: Reset now properly resets everything
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(focusTime);
    setSeconds(0);
  };

  const skipSession = () => {
    if (!isBreak) {
      setIsBreak(true);
      setMinutes(breakTime);
    } else {
      setIsBreak(false);
      setMinutes(focusTime);
    }
    setSeconds(0);
    setIsActive(false);
  };

  // FIXED: Apply settings properly resets timer with new values
  const applySettings = () => {
    setMinutes(focusTime);
    setSeconds(0);
    setIsActive(false);
    setIsBreak(false);
    setShowSettings(false);
  };

  // Format time display
  const formatTime = (min, sec) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="focus-container-new">
      <button onClick={() => navigate("/dashboard")} className="back-btn-new">
        ← Back to Dashboard
      </button>

      <div className="focus-content-new">
        <h1 className="focus-title-new">🔥 Focus Mode</h1>
        <p className="focus-subtitle-new">
          Stay focused with the Pomodoro Technique
        </p>

        {/* Timer Display */}
        <div className={`timer-display-new ${isActive ? 'active' : ''} ${isBreak ? 'break' : ''}`}>
          <div className="timer-label-new">
            {isBreak ? '☕ Break Time' : '📚 Focus Time'}
          </div>
          <div className="timer-time-new">
            {formatTime(minutes, seconds)}
          </div>
          <div className="timer-progress-new">
            <div 
              className="timer-progress-bar-new"
              style={{
                width: `${((isBreak ? breakTime : focusTime) * 60 - (minutes * 60 + seconds)) / ((isBreak ? breakTime : focusTime) * 60) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls-new">
          {!isActive ? (
            <button className="control-btn-new primary" onClick={startTimer}>
              ▶️ Start
            </button>
          ) : (
            <button className="control-btn-new secondary" onClick={pauseTimer}>
              ⏸️ Pause
            </button>
          )}
          
          <button className="control-btn-new secondary" onClick={resetTimer}>
            🔄 Reset
          </button>
          
          <button className="control-btn-new secondary" onClick={skipSession}>
            ⏭️ Skip
          </button>
        </div>

        {/* Stats */}
        <div className="focus-stats-new">
          <div className="stat-card-new">
            <div className="stat-value-new">{sessionsCompleted}</div>
            <div className="stat-label-new">Sessions Completed</div>
          </div>
          <div className="stat-card-new">
            <div className="stat-value-new">{sessionsCompleted * focusTime}</div>
            <div className="stat-label-new">Minutes Focused</div>
          </div>
        </div>

        {/* Settings Button */}
        <button 
          className="settings-btn-new"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ {showSettings ? 'Hide Settings' : 'Customize Timer'}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel-new">
            <h3>⚙️ Timer Settings</h3>
            
            <div className="setting-item-new">
              <label>🎯 Focus Time (minutes)</label>
              <div className="time-input-group">
                <button 
                  className="time-btn"
                  onClick={() => setFocusTime(Math.max(1, focusTime - 5))}
                >
                  -
                </button>
                <input
                  type="number"
                  value={focusTime}
                  onChange={(e) => setFocusTime(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="60"
                />
                <button 
                  className="time-btn"
                  onClick={() => setFocusTime(Math.min(60, focusTime + 5))}
                >
                  +
                </button>
              </div>
              <small>Current: {focusTime} minutes</small>
            </div>

            <div className="setting-item-new">
              <label>☕ Break Time (minutes)</label>
              <div className="time-input-group">
                <button 
                  className="time-btn"
                  onClick={() => setBreakTime(Math.max(1, breakTime - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  value={breakTime}
                  onChange={(e) => setBreakTime(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="30"
                />
                <button 
                  className="time-btn"
                  onClick={() => setBreakTime(Math.min(30, breakTime + 1))}
                >
                  +
                </button>
              </div>
              <small>Current: {breakTime} minutes</small>
            </div>

            {/* Quick Presets */}
            <div className="presets-section">
              <label>⚡ Quick Presets:</label>
              <div className="preset-buttons">
                <button 
                  className="preset-btn"
                  onClick={() => {
                    setFocusTime(25);
                    setBreakTime(5);
                  }}
                >
                  Classic (25/5)
                </button>
                <button 
                  className="preset-btn"
                  onClick={() => {
                    setFocusTime(50);
                    setBreakTime(10);
                  }}
                >
                  Long (50/10)
                </button>
                <button 
                  className="preset-btn"
                  onClick={() => {
                    setFocusTime(15);
                    setBreakTime(3);
                  }}
                >
                  Short (15/3)
                </button>
              </div>
            </div>

            <div className="setting-actions-new">
              <button onClick={applySettings} className="apply-btn-new">
                ✅ Apply & Reset Timer
              </button>
              <button onClick={() => setShowSettings(false)} className="cancel-btn-new">
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="focus-tips-new">
          <h4>💡 Focus Tips</h4>
          <ul>
            <li>Put your phone on silent mode</li>
            <li>Close unnecessary tabs and apps</li>
            <li>Use the break time to stretch and rest your eyes</li>
            <li>Stay hydrated during breaks</li>
            <li>Take a longer break after 4 focus sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}