import React from "react";
import "./OnboardingModal.css";

const OnboardingModal = ({ onClose }) => {
  return (
    <div className="onboarding-modal">
      <div className="onboarding-content">
        <h2>Welcome to TechTime Nexus!</h2>
        <p>
          This app allows you to create and store TechTime Nexus that can
          be opened on a specific date or after certain milestones.
        </p>
        <ul>
          <li>Create a capsule with a message and a trigger condition.</li>
          <li>View your capsules and track their progress.</li>
          <li>Analyze your capsule activity in the analytics dashboard.</li>
        </ul>
        <button className="close-btn" onClick={onClose}>Get Started</button>
      </div>
    </div>
  );
};

export default OnboardingModal;