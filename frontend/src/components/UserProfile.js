import React, { useState } from "react";
import "./UserProfile.css";

const UserProfile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [username, setUsername] = useState("User");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="user-profile">
      <h2>My Profile</h2>
      <div className="profile-pic-container">
        <img
          src={profilePic || "default-profile.png"}
          alt="Profile"
          className="profile-pic"
        />
        <input type="file" onChange={handleFileChange} />
      </div>
      <div className="username-container">
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
    </div>
  );
};

export default UserProfile;