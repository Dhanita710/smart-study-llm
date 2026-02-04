import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatAssistant.css"; // Make sure this file exists

export default function ChatAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  return (
    <div className="chat-container">
      <button onClick={() => navigate("/dashboard")} className="back-btn">
        ← Back to Dashboard
      </button>

      <div className="chat-content">
        <h1 className="chat-title">🎓 AI Chat Tutor</h1>
        <p className="chat-subtitle">
          Ask your questions and get instant explanations
        </p>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>👋 Hi! I'm your AI tutor. Ask me anything!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))
          )}
        </div>

        <div className="chat-input-section">
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && console.log("Send message")}
          />
          <button onClick={() => console.log("Send message")}>
            Send
          </button>
        </div>

        <div className="coming-soon-notice">
          <p>🚧 Full AI chat functionality coming soon!</p>
        </div>
      </div>
    </div>
  );
}