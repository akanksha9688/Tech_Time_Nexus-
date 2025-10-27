import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavigationBar.css";

const NavigationBar = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">⏳ TechTime Nexus</Link>
        </div>
        <div className="nav-right">
          {isAuthPage ? (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/about" className="nav-link">About</Link>
            </>
          ) : isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/about" className="nav-link">About</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
