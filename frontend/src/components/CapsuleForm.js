// import React, { useState } from "react";
// import API from "../api";
// import CapsuleTypeSelector from "./CapsuleTypeSelector";
// import GitHubCapsuleButton from './GitHubCapsuleButton';
// import "./CapsuleForm.css";

// export default function CapsuleForm({ onCreated }) {
//   const [type, setType] = useState("");
//   const [title, setTitle] = useState("");
//   const [message, setMessage] = useState("");
//   const [triggerValue, setTriggerValue] = useState("");
//   const [theme, setTheme] = useState("default");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     let triggerType =
//       type === "github"
//         ? "milestone"
//         : type === "location"
//         ? "location"
//         : "date";

//     try {
//       await API.post("/capsule/create", {
//         title,
//         message,
//         triggerType,
//         triggerValue,
//         theme,
//       });
//       alert("🎉 Capsule Created!");
//       onCreated();
//       setTitle("");
//       setMessage("");
//       setTriggerValue("");
//       setType("");
//       setTheme("default");
//     } catch (err) {
//       alert("❌ Error creating capsule");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="capsule-form">
//       <h2 className="form-title">📦 Create Your Time Capsule</h2>

//       <CapsuleTypeSelector type={type} setType={setType} />

//       {type === 'github' && (
//         <div className="form-group">
//           <GitHubCapsuleButton capsuleType={type} />
//         </div>
//       )}

//       <div className="form-group">
//         <label htmlFor="title">✨ Title</label>
//         <input
//           type="text"
//           id="title"
//           placeholder="e.g. Message to Future Me"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           required
//         />
//       </div>

//       <div className="form-group">
//         <label htmlFor="message">📜 Message</label>
//         <textarea
//           id="message"
//           placeholder="Write your message to the future..."
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           rows={5}
//           required
//         />
//       </div>

//       {type === "github" && (
//         <div className="form-group">
//           <label htmlFor="triggerValue">🛠 GitHub PR Milestone</label>
//           <input
//             type="number"
//             id="triggerValue"
//             placeholder="e.g. 100"
//             value={triggerValue}
//             onChange={(e) => setTriggerValue(e.target.value)}
//             required
//           />
//         </div>
//       )}
//       {type === "location" && (
//         <div className="form-group">
//           <label htmlFor="triggerValue">📍 Location (e.g. Paris)</label>
//           <input
//             type="text"
//             id="triggerValue"
//             placeholder="e.g. Paris"
//             value={triggerValue}
//             onChange={(e) => setTriggerValue(e.target.value)}
//             required
//           />
//         </div>
//       )}
//       {(type !== "github" && type !== "location") && (
//         <div className="form-group">
//           <label htmlFor="triggerValue">⏳ Open Date</label>
//           <input
//             type="datetime-local"
//             id="triggerValue"
//             value={triggerValue}
//             onChange={(e) => setTriggerValue(e.target.value)}
//             required
//           />
//         </div>
//       )}

//       <div className="form-group">
//         <label htmlFor="theme">🎨 Choose Theme</label>
//         <select
//           id="theme"
//           value={theme}
//           onChange={(e) => setTheme(e.target.value)}
//         >
//           <option value="default">🌟 Default</option>
//           <option value="space">🚀 Space</option>
//           <option value="ocean">🌊 Ocean</option>
//           <option value="forest">🌲 Forest</option>
//         </select>
//       </div>

//       <button type="submit" className="submit-button">
//         🚀 Launch Capsule
//       </button>
//     </form>
//   );
// }


import React, { useState } from "react";
import API from "../api";
import CapsuleTypeSelector from "./CapsuleTypeSelector";
import GitHubCapsuleButton from "./GitHubCapsuleButton";
import "./CapsuleForm.css";

export default function CapsuleForm({ onCreated }) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [triggerValue, setTriggerValue] = useState("");
  const [theme, setTheme] = useState("default");

  const handleSubmit = async (e) => {
    e.preventDefault();

    let triggerType =
      type === "github"
        ? "milestone"
        : type === "location"
        ? "location"
        : "date";

    try {
      await API.post("/api/capsule/create", {
        title,
        message,
        triggerType,
        triggerValue,
        theme,
        type, // Send user-friendly capsule type
      });
      alert("🎉 Capsule Created!");
      onCreated();
      setTitle("");
      setMessage("");
      setTriggerValue("");
      setType("");
      setTheme("default");
    } catch (err) {
      alert("❌ Error creating capsule");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="capsule-form">
      <h2 className="form-title">📦 Create Your Time Capsule</h2>

      <CapsuleTypeSelector type={type} setType={setType} />

      {type === "github" && (
        <div className="form-group">
          <GitHubCapsuleButton capsuleType={type} />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="title">✨ Title</label>
        <input
          type="text"
          id="title"
          placeholder="e.g. Message to Future Me"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">📜 Message</label>
        <textarea
          id="message"
          placeholder="Write your message to the future..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
        />
      </div>

      {type === "github" && (
        <div className="form-group">
          <label htmlFor="triggerValue">🛠 GitHub PR Milestone</label>
          <input
            type="number"
            id="triggerValue"
            placeholder="e.g. 100"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            required
          />
        </div>
      )}
      {type === "location" && (
        <div className="form-group">
          <label htmlFor="triggerValue">📍 Location (e.g. Paris)</label>
          <input
            type="text"
            id="triggerValue"
            placeholder="e.g. Paris"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            required
          />
        </div>
      )}
      {type !== "github" && type !== "location" && (
        <div className="form-group">
          <label htmlFor="triggerValue">⏳ Open Date</label>
          <input
            type="datetime-local"
            id="triggerValue"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="theme">🎨 Choose Theme</label>
        <select
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="default">🌟 Default</option>
          <option value="space">🚀 Space</option>
          <option value="ocean">🌊 Ocean</option>
          <option value="forest">🌲 Forest</option>
        </select>
      </div>

      <button type="submit" className="submit-button">
        🚀 Launch Capsule
      </button>
    </form>
  );
}

