import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GitHubCapsuleForm = ({ onSubmit }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [prMilestone, setPrMilestone] = useState('');

  useEffect(() => {
    // Check GitHub connection status
    axios.get(`${process.env.REACT_APP_API_URL}/auth/github/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((response) => setIsConnected(response.data.connected))
      .catch((error) => console.error('Error checking GitHub connection:', error));
  }, []);

  const handleConnectGitHub = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/github`; // Redirect to GitHub OAuth
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prMilestone) {
      alert('Please set a PR milestone.');
      return;
    }
    onSubmit({ prMilestone });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>GitHub Capsule</h2>
      {!isConnected ? (
        <button type="button" onClick={handleConnectGitHub}>
          Connect to GitHub
        </button>
      ) : (
        <div>
          <label>
            Set PR Milestone:
            <input
              type="number"
              value={prMilestone}
              onChange={(e) => setPrMilestone(e.target.value)}
              placeholder="Enter PR milestone"
            />
          </label>
          <button type="submit">Save Capsule</button>
        </div>
      )}
    </form>
  );
};

export default GitHubCapsuleForm;
