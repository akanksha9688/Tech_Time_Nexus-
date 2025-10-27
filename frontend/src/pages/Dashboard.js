import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Achievements from "../components/Achievements";
import UserProfile from "../components/UserProfile";
import NavigationBar from "../components/NavigationBar";
import CapsuleTimeline from "../components/CapsuleTimeline";
import CapsuleGraph from "../components/CapsuleGraph";
import { FaUserCircle, FaTrophy, FaChartLine } from 'react-icons/fa';
import AboutUs from "../pages/AboutUs"; // Import the About Us page

const sampleMilestones = [
  { title: "First Capsule", description: "Created your first time capsule!", badge: "🎉" },
  { title: "Capsule Enthusiast", description: "Created 10 capsules!", badge: "🏆" },
  { title: "Capsule Master", description: "Created 50 capsules!", badge: "🌟" },
];

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [prStatus, setPrStatus] = useState(null);
  const [capsuleCount, setCapsuleCount] = useState(0);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
      fetchUserData(token);
    } else {
      const storedToken = localStorage.getItem('jwtToken');
      if (storedToken) {
        fetchUserData(storedToken);
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/github/check-pr-milestone`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
      setCapsuleCount(response.data.capsuleCount || 0);
      setPrStatus('🎉 Milestone achieved!');
    } catch (error) {
      console.error('Error fetching user data', error);
      setPrStatus('⚠️ Failed to fetch milestone info.');
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h1 className="dashboard-title">🚀 Developer Dashboard</h1>
          {userData ? (
            <p className="dashboard-welcome">👋 Welcome back, <strong>{userData.username}</strong></p>
          ) : (
            <p className="dashboard-loading">⏳ Loading user data...</p>
          )}
          {prStatus && <p className="dashboard-status">{prStatus}</p>}

          {/* Capsule Count & Progress */}
          <div className="dashboard-section">
            <h2>📦 Capsule Progress</h2>
            <p>Total Capsules Created: <strong>{capsuleCount}</strong></p>
            <progress value={capsuleCount} max="50" className="capsule-progress"></progress>
          </div>

          {/* Profile */}
          <div className="dashboard-section">
            <h2><FaUserCircle /> Profile</h2>
            <UserProfile />
          </div>

          {/* Achievements */}
          <div className="dashboard-section">
            <h2><FaTrophy /> Achievements</h2>
            <Achievements milestones={sampleMilestones} />
          </div>

          {/* Timeline */}
          <div className="dashboard-section">
            <h2>📜 Capsule Timeline</h2>
            <CapsuleTimeline />
          </div>

          {/* Capsule Graph */}
          <div className="dashboard-section">
            <h2><FaChartLine /> Capsule Creation Summary</h2>
            <CapsuleGraph />
          </div>

          {/* About Us Section */}
          <div className="dashboard-section">
            <h2>📖 About Us</h2>
            <AboutUs />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
