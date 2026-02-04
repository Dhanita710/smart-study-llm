import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "./StudyBuddy.css";

// ✅ FastAPI Backend URL
const API_BASE = "http://localhost:8000";

function StudyBuddy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");
  const [availableBuddies, setAvailableBuddies] = useState([]);
  const [myBuddies, setMyBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [preferences, setPreferences] = useState({
    subject: "General",
    level: "Intermediate",
    availability: "Weekdays",
    studyStyle: "Collaborative",
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error("Error getting token:", error);
        return null;
      }
    }
    return null;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      if (activeTab === "discover") {
        await loadAvailableBuddies(token);
      } else if (activeTab === "mybuddies") {
        await loadMyBuddies(token);
      } else if (activeTab === "requests") {
        await loadPendingRequests(token);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBuddies = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/study-buddy/available`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAvailableBuddies(data.buddies || []);
    } catch (error) {
      console.error("Error loading buddies:", error);
      setError("Failed to load available buddies");
    }
  };

  const loadMyBuddies = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/study-buddy/my-buddies`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMyBuddies(data.buddies || []);
    } catch (error) {
      console.error("Error loading my buddies:", error);
      setError("Failed to load your buddies");
    }
  };

  const loadPendingRequests = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/study-buddy/requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      setError("Failed to load pending requests");
    }
  };

  const sendBuddyRequest = async (buddyId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert("Please log in again");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/api/study-buddy/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          buddyId,
          message: requestMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert("Request sent successfully! 🎉");
      setSelectedBuddy(null);
      setRequestMessage("");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Please try again.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert("Please log in again");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/study-buddy/accept/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("Request accepted! 🤝");
      loadPendingRequests(token);
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert("Please log in again");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/study-buddy/decline/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("Request declined");
      loadPendingRequests(token);
    } catch (error) {
      console.error("Error declining request:", error);
      alert("Failed to decline request. Please try again.");
    }
  };

  const savePreferences = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert("Please log in again");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/api/study-buddy/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("Preferences saved! ✨");
      setShowPreferences(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    }
  };

  return (
    <div className="study-buddy-container">
      <header className="buddy-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1 className="buddy-title">👥 Study Buddy Finder</h1>
        <button
          className="preferences-btn"
          onClick={() => setShowPreferences(!showPreferences)}
        >
          ⚙️
        </button>
      </header>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="preferences-modal">
          <div className="modal-content">
            <h2>Study Preferences</h2>
            <div className="pref-group">
              <label>Subject Interest</label>
              <select
                value={preferences.subject}
                onChange={(e) =>
                  setPreferences({ ...preferences, subject: e.target.value })
                }
              >
                <option>Mathematics</option>
                <option>Science</option>
                <option>Programming</option>
                <option>Languages</option>
                <option>Business</option>
                <option>General</option>
              </select>
            </div>

            <div className="pref-group">
              <label>Study Level</label>
              <select
                value={preferences.level}
                onChange={(e) =>
                  setPreferences({ ...preferences, level: e.target.value })
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="pref-group">
              <label>Availability</label>
              <select
                value={preferences.availability}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    availability: e.target.value,
                  })
                }
              >
                <option>Weekdays</option>
                <option>Weekends</option>
                <option>Evenings</option>
                <option>Flexible</option>
              </select>
            </div>

            <div className="pref-group">
              <label>Study Style</label>
              <select
                value={preferences.studyStyle}
                onChange={(e) =>
                  setPreferences({ ...preferences, studyStyle: e.target.value })
                }
              >
                <option>Collaborative</option>
                <option>Competitive</option>
                <option>Teaching</option>
                <option>Learning</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={savePreferences} className="save-btn">
                Save
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="buddy-tabs">
        <button
          className={`tab ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => setActiveTab("discover")}
        >
          🔍 Discover
        </button>
        <button
          className={`tab ${activeTab === "mybuddies" ? "active" : ""}`}
          onClick={() => setActiveTab("mybuddies")}
        >
          👥 My Buddies
        </button>
        <button
          className={`tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📬 Requests
          {pendingRequests.length > 0 && (
            <span className="badge">{pendingRequests.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="buddy-content">
        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === "discover" && (
              <div className="discover-section">
                <h2 className="section-subtitle">
                  Find Your Perfect Study Partner
                </h2>
                {availableBuddies.length === 0 ? (
                  <div className="empty-state">
                    <p>🔍 No study buddies available yet</p>
                    <p className="empty-subtitle">
                      Be the first to create a profile!
                    </p>
                  </div>
                ) : (
                  <div className="buddies-grid">
                    {availableBuddies.map((buddy) => (
                      <div key={buddy.id} className="buddy-card">
                        <div className="buddy-avatar">
                          {buddy.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="buddy-info">
                          <h3>{buddy.name}</h3>
                          <p className="buddy-subject">📚 {buddy.subject}</p>
                          <p className="buddy-level">🎓 {buddy.level}</p>
                          <p className="buddy-availability">
                            🕐 {buddy.availability}
                          </p>
                          <div className="match-score">
                            <span className="match-label">Match:</span>
                            <div className="match-bar">
                              <div
                                className="match-fill"
                                style={{ width: `${buddy.matchScore}%` }}
                              ></div>
                            </div>
                            <span className="match-percent">
                              {buddy.matchScore}%
                            </span>
                          </div>
                        </div>
                        <button
                          className="connect-btn"
                          onClick={() => setSelectedBuddy(buddy)}
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Buddies Tab */}
            {activeTab === "mybuddies" && (
              <div className="mybuddies-section">
                <h2 className="section-subtitle">Your Study Partners</h2>
                {myBuddies.length === 0 ? (
                  <div className="empty-state">
                    <p>🤝 No study buddies yet</p>
                    <p className="empty-subtitle">
                      Start by discovering and connecting with others!
                    </p>
                  </div>
                ) : (
                  <div className="buddies-list">
                    {myBuddies.map((buddy) => (
                      <div key={buddy.id} className="buddy-item">
                        <div className="buddy-avatar-small">
                          {buddy.name.charAt(0).toUpperCase()}
                          {buddy.online && <span className="online-dot"></span>}
                        </div>
                        <div className="buddy-details">
                          <h4>{buddy.name}</h4>
                          <p>📚 {buddy.subject}</p>
                        </div>
                        <button className="message-btn">💬 Message</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="requests-section">
                <h2 className="section-subtitle">Pending Requests</h2>
                {pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>📭 No pending requests</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="request-card">
                        <div className="request-header">
                          <div className="buddy-avatar-small">
                            {request.fromUserName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{request.fromUserName}</h4>
                            <p className="request-subject">
                              📚 {request.subject}
                            </p>
                          </div>
                        </div>
                        {request.message && (
                          <p className="request-message">
                            "{request.message}"
                          </p>
                        )}
                        <div className="request-actions">
                          <button
                            className="accept-btn"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            ✓ Accept
                          </button>
                          <button
                            className="decline-btn"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            ✗ Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Connect Modal */}
      {selectedBuddy && (
        <div className="connect-modal">
          <div className="modal-content">
            <h2>Connect with {selectedBuddy.name}</h2>
            <div className="buddy-preview">
              <div className="buddy-avatar-large">
                {selectedBuddy.name.charAt(0).toUpperCase()}
              </div>
              <p>📚 {selectedBuddy.subject}</p>
              <p>🎓 {selectedBuddy.level}</p>
            </div>
            <textarea
              placeholder="Add a personal message (optional)..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="message-input"
              rows="4"
            />
            <div className="modal-actions">
              <button
                onClick={() => sendBuddyRequest(selectedBuddy.id)}
                className="send-btn"
              >
                Send Request
              </button>
              <button
                onClick={() => {
                  setSelectedBuddy(null);
                  setRequestMessage("");
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyBuddy;