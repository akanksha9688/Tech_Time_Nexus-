import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GitHubCapsuleForm from './GitHubCapsuleForm';
import { useNavigate } from 'react-router-dom';

const GitHubCapsuleButton = ({ capsuleType }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL); // Debugging log
    if (capsuleType === 'github') {
      // Check GitHub connection status
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/github/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then((response) => {
          setIsConnected(response.data.connected);
          if (response.data.connected) {
            setShowForm(true);
          }
        })
        .catch((error) => console.error('Error checking GitHub connection:', error));
    }
  }, [capsuleType]);

  const handleConnectGitHub = () => {
    console.log('Redirecting to GitHub OAuth...'); // Debugging log
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/auth/github`; // Corrected URL for GitHub OAuth
  };

  const handleFormSubmit = (data) => {
    console.log('PR Milestone Data:', data);
    navigate('/dashboard'); // Redirect to the dashboard or another page after form submission
  };

  return (
    <div>
      {capsuleType === 'github' && (
        !isConnected ? (
          <button onClick={handleConnectGitHub}>Connect to GitHub</button>
        ) : (
          <>
            {showForm && <p>You are already connected, please fill out the form.</p>}
            {showForm && <GitHubCapsuleForm onSubmit={handleFormSubmit} />}
          </>
        )
      )}
    </div>
  );
};

export default GitHubCapsuleButton;
