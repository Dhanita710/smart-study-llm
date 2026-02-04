import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "./Hero.css";

import Features from "./Features";
import Footer from "./Footer";

export default function Hero() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const images = [
    "/images/llm1.jpg",
    "/images/llm2.jpg",
    "/images/llm3.jpg",
    "/images/llm4.jpg",
  ];

  const [index, setIndex] = useState(0);

  // 🔐 Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🖼️ Image slider
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-container">
      {/* Navbar */}
      <nav className="hero-nav">
        <h1 className="logo">Smart Study</h1>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <div className="hero-badge">
            ✨ NEW • AI-powered study planner
          </div>

          <h1 className="hero-title">
            The smartest way<br />to plan your study
          </h1>

          <p className="hero-text">
            Smart AI creates perfect study plans based on your syllabus,
            deadlines, and daily routine — helping you stay consistent & stress-free.
          </p>

          <div className="hero-buttons">
            {loading ? (
              <p style={{ opacity: 0.7 }}>Checking login...</p>
            ) : !user ? (
              <>
                <Link to="/signup">
                  <button className="primary-btn">Sign Up Free</button>
                </Link>
                <Link to="/login">
                  <button className="secondary-btn">Login</button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <button className="primary-btn">
                  Go to Dashboard 🚀
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="hero-right">
          <div className="slider-container">
            <img
              src={images[index]}
              alt="study"
              className="slider-image"
            />
            <div className="slider-overlay"></div>
          </div>
        </div>
      </div>

      {/* 🔥 YOUR EXISTING COMPONENTS */}
      <Features />
      <Footer />
    </div>
  );
}
