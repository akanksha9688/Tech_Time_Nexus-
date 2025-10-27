import React from "react";
import "./Achievements.css";

const Achievements = ({ milestones }) => {
  return (
    <div className="achievements-container">
      <h2>Achievements</h2>
      <div className="achievements-grid">
        {milestones.map((milestone, index) => (
          <div key={index} className="achievement-card">
            <h3>{milestone.title}</h3>
            <p>{milestone.description}</p>
            <span className="badge">{milestone.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;