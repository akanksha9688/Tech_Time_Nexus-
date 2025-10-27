import React from "react";

export default function CapsuleTypeSelector({ type, setType }) {
  return (
    <div className="mb-4">
      <label className="block font-bold">Select Capsule Type:</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">-- Choose --</option>
        <option value="birthday">Birthday Capsule</option>
        <option value="anniversary">Anniversary Capsule</option>
        <option value="others">Others</option>
        <option value="github">GitHub PR Milestone</option>
        <option value="location">Location Capsule</option>
      </select>
    </div>
  );
}
