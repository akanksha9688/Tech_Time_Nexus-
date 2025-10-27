import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CapsuleForm from "./components/CapsuleForm";
import CapsuleList from "./components/CapsuleList";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import OnboardingModal from "./components/OnboardingModal";
import AboutUs from "./pages/AboutUs"; // Import the About Us page

import "./App.css";
import "./AppTransitions.css";

const useQuery = () => new URLSearchParams(useLocation().search);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const query = useQuery();
  const location = useLocation();

  useEffect(() => {
    const tokenFromUrl = query.get("token");
    const usernameFromUrl = query.get("username");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("github_connected", "true");
      alert(`Welcome, ${usernameFromUrl || "GitHub User"}`);
      setIsLoggedIn(true);
      window.history.replaceState({}, document.title, "/github-capsule");
      window.location.reload();
    } else {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    }
  }, [query]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("github_connected");
    setIsLoggedIn(false);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  return (
    <div className="app-container">
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      <header className="app-header">
        <h1 className="app-title">⏳ TechTime Nexus</h1>
      </header>

      {!isLoggedIn ? (
        <div className="auth-container">
          <div className="auth-card">
            {showRegister ? (
              <Register onRegister={handleLoginSuccess} />
            ) : (
              <Login onLogin={handleLoginSuccess} />
            )}
            <p className="auth-toggle">
              {showRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button className="toggle-btn" onClick={() => setShowRegister(!showRegister)}>
                {showRegister ? "Login" : "Register"}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <>
          <nav className="navbar">
            <div className="nav-links">
              <Link to="/" className={location.pathname === "/" ? "active" : ""}>Create</Link>
              <Link to="/list" className={location.pathname === "/list" ? "active" : ""}>My Capsules</Link>
              <Link to="/analytics" className={location.pathname === "/analytics" ? "active" : ""}>Analytics</Link>
              <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>About Us</Link>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </nav>

          <main className="main-content">
            <div>
              <Routes location={location}>
                <Route path="/" element={<CapsuleForm onCreated={() => {}} />} />
                <Route path="/list" element={<CapsuleList />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/about" element={<AboutUs />} /> 
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
