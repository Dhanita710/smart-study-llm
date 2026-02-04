import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer-container">

      <div className="footer-content">

        {/* Brand */}
        <div className="footer-section">
          <h2 className="footer-logo">SmartStudy</h2>
          <p className="footer-text">
            AI-powered study planner that helps students stay organized,
            consistent, and stress-free.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li><a href="#">Home</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">AI Planner</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-links">
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} SmartStudy. All rights reserved.
      </div>

    </footer>
  );
}
