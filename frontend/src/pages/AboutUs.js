import React from "react";
import "./AboutUs.css";
import { FaPlusCircle, FaEye, FaChartLine } from "react-icons/fa";

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <h1>About <span className="highlight">TechTime Nexus</span></h1>
      <p className="mission">
        TechTime Nexus lets you preserve thoughts, memories, and goals — and revisit them in the future with meaning.
      </p>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="feature-cards">
          <div className="card">
            <FaPlusCircle className="icon" />
            <h3>Create</h3>
            <p>Use the "Create Capsule" tool to safely store your messages, milestones, and media.</p>
          </div>
          <div className="card">
            <FaEye className="icon" />
            <h3>View</h3>
            <p>Open your capsules when the time is right, and reflect on your growth and goals.</p>
          </div>
          <div className="card">
            <FaChartLine className="icon" />
            <h3>Analyze</h3>
            <p>Explore your memory patterns and insights with our analytics dashboard.</p>
          </div>
        </div>
      </div>

      <p className="summary">
        Whether you’re documenting a dream or capturing a moment, Time Capsule helps you hold onto what matters — and look forward to what’s next.
      </p>

      <div className="cta-buttons">
        <button onClick={() => window.location.href = "/create"}>Create a Capsule</button>
        <button onClick={() => window.location.href = "/dashboard"} className="secondary">Go to Dashboard</button>
      </div>
    </div>
  );
};

export default AboutUs;
