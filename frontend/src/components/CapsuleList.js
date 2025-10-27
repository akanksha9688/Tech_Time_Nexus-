// // CapsuleList.js
// import React, { useEffect, useState, useRef } from "react";
// import API from "../api";
// import confetti from "canvas-confetti";
// import { ClipLoader } from "react-spinners";
// import { FaShareAlt, FaStar, FaTrash, FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
// import "./CapsuleList.css";

// export default function CapsuleList() {
//   const [capsules, setCapsules] = useState([]);
//   const [expandedId, setExpandedId] = useState(null);
//   const [timeLeftMap, setTimeLeftMap] = useState({});
//   const deliveredCapsules = useRef(new Set());
//   const [loading, setLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [openedCount, setOpenedCount] = useState(0);
//   const [pendingCount, setPendingCount] = useState(0);
//   const [activityLog, setActivityLog] = useState([]);

//   const fetchCapsules = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get("/capsule/mine");
//       setCapsules(res.data);

//       const opened = res.data.filter((cap) => cap.isDelivered).length;
//       const pending = res.data.length - opened;
//       setOpenedCount(opened);
//       setPendingCount(pending);

//       const newLog = [];
//       res.data.forEach((cap) => {
//         if (cap.isDelivered && !deliveredCapsules.current.has(cap.id)) {
//           deliveredCapsules.current.add(cap.id);
//           confetti({ particleCount: 70, spread: 100, origin: { y: 0.6 } });
//           newLog.push(`📬 Opened capsule "${cap.title}"`);
//         }
//       });
//       setActivityLog((prev) => [...newLog, ...prev]);
//     } catch (error) {
//       console.error("Error fetching capsules:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCapsules();
//     const fetchInterval = setInterval(fetchCapsules, 60000);
//     return () => clearInterval(fetchInterval);
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const updatedMap = {};
//       capsules.forEach((cap) => {
//         if (!cap.isDelivered && cap.triggerType === "date") {
//           const now = new Date();
//           const target = new Date(cap.triggerValue);
//           const diff = Math.max(0, target - now);
//           const seconds = Math.floor((diff / 1000) % 60);
//           const minutes = Math.floor((diff / 1000 / 60) % 60);
//           const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//           const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//           updatedMap[cap.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
//         }
//       });
//       setTimeLeftMap(updatedMap);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [capsules]);

//   const handleDeleteCapsule = async (id) => {
//     try {
//       await API.delete(`/capsule/${id}`);
//       alert("Capsule deleted successfully.");
//       setActivityLog((prev) => [`❌ Deleted capsule ID ${id}`, ...prev]);
//       fetchCapsules();
//     } catch (error) {
//       console.error("Error deleting capsule:", error);
//       alert("Failed to delete capsule.");
//     }
//   };

//   const handleShare = (id) => {
//     const shareUrl = `${window.location.origin}/capsule/${id}`;
//     navigator.clipboard.writeText(shareUrl);
//     alert("Capsule link copied!");
//     setActivityLog((prev) => [`🔗 Shared capsule ID ${id}`, ...prev]);
//   };

//   const handleRating = (id, rating) => {
//     alert(`You rated capsule ID ${id} with ${rating} stars!`);
//     setActivityLog((prev) => [`⭐ Rated capsule ${id} with ${rating} stars`, ...prev]);
//   };

//   const handleViewMessage = async (id) => {
//     // Always fetch latest capsules before showing message
//     try {
//       const res = await API.get("/capsule/mine");
//       const latestCapsules = res.data;
//       const capsule = latestCapsules.find((cap) => cap.id === id);
//       if (capsule && capsule.isDelivered) {
//         setCapsules(latestCapsules); // update state so UI is in sync
//         setExpandedId(expandedId === id ? null : id);
//       } else {
//         alert("Capsule will open after the trigger date.");
//       }
//     } catch (err) {
//       alert("Failed to check capsule status. Please try again.");
//     }
//   };

//   const calculateProgress = (cap) => {
//     if (cap.isDelivered || cap.triggerType !== "date") return 100;
//     const triggerTime = new Date(cap.triggerValue).getTime();
//     const createdTime = new Date(cap.createdAt).getTime();
//     const now = new Date().getTime();
//     const total = triggerTime - createdTime;
//     const elapsed = now - createdTime;
//     return Math.min(100, Math.max(0, (elapsed / total) * 100));
//   };

//   const filteredCapsules = capsules.filter((cap) =>
//     cap.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Haversine formula to calculate distance between two lat/lng points in km
//   function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Radius of the earth in km
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a =
//       0.5 - Math.cos(dLat)/2 +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//       (1 - Math.cos(dLon))/2;
//     return R * 2 * Math.asin(Math.sqrt(a));
//   }

//   // Simulated location check-in for Paris using real GPS
//   const handleParisCheckIn = async () => {
//     // Paris coordinates
//     const parisLat = 48.8566;
//     const parisLng = 2.3522;
//     try {
//       if (!navigator.geolocation) {
//         alert("Geolocation is not supported by your browser.");
//         return;
//       }
//       navigator.geolocation.getCurrentPosition(async (position) => {
//         const { latitude, longitude } = position.coords;
//         const distance = getDistanceFromLatLonInKm(latitude, longitude, parisLat, parisLng);
//         if (distance > 50) { // 50km radius
//           alert("You are not in the expected location (Paris). Please travel to Paris to open this capsule.");
//           setActivityLog((prev) => [
//             `❌ Check-in failed: Not in Paris (distance: ${distance.toFixed(1)} km)`,
//             ...prev
//           ]);
//           return;
//         }
//         // Assume userId is available in the first capsule (or get from auth context if available)
//         const userId = capsules[0]?.userId;
//         if (!userId) {
//           alert("User ID not found. Please refresh or log in again.");
//           return;
//         }
//         const res = await API.post("/capsule/checkin", { userId, location: "Paris", latitude, longitude });
//         alert(res.data.message);
//         fetchCapsules();
//         setActivityLog((prev) => [
//           `📍 Checked in at Paris: ${res.data.message}`,
//           ...prev
//         ]);
//       }, (error) => {
//         alert("Could not get your location. Please allow location access and try again.");
//       });
//     } catch (err) {
//       alert("Failed to check in at Paris. Please try again.");
//     }
//   };

//   return (
//     <div className="capsule-list-container">
//       <div className="capsule-summary">
//         <h2>📦 Capsule Summary</h2>
//         <p>Total: {capsules.length} | 📬 Opened: {openedCount} | 🔒 Pending: {pendingCount}</p>
//         <div className="summary-bars">
//           <div className="bar opened" style={{ width: `${(openedCount / capsules.length) * 100 || 0}%` }} />
//           <div className="bar pending" style={{ width: `${(pendingCount / capsules.length) * 100 || 0}%` }} />
//         </div>
//       </div>

//       <div className="capsule-list-header">
//         <h2>🎁 My Capsules</h2>
//         <button onClick={fetchCapsules} className="refresh-button">
//           <FaSyncAlt /> Refresh
//         </button>
//       </div>

//       <input
//         type="text"
//         placeholder="🔍 Search capsules..."
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className="search-bar"
//       />

//       {loading ? (
//         <div className="spinner-container">
//           <ClipLoader size={50} color="#4A90E2" />
//         </div>
//       ) : (
//         <div className="capsule-grid">
//           {filteredCapsules.length === 0 ? (
//             <p>No capsules found.</p>
//           ) : (
//             filteredCapsules.map((cap) => {
//               const progress = calculateProgress(cap);
//               const timeLeft = timeLeftMap[cap.id];

//               // Per-capsule check-in handler for location capsules (now supports any location)
//               const handleLocationCheckIn = async () => {
//                 if (!cap.triggerValue) {
//                   alert("No location set for this capsule.");
//                   return;
//                 }
//                 // 1. Geocode the location name to get lat/lng and type
//                 let loc, geoType, geoClass, geoDisplayName;
//                 try {
//                   const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cap.triggerValue)}`);
//                   const geoData = await geoRes.json();
//                   if (!geoData.length) {
//                     alert(`Could not find coordinates for '${cap.triggerValue}'. Please check the location name.`);
//                     return;
//                   }
//                   loc = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
//                   geoType = geoData[0].type; // e.g., 'country', 'city', 'village', 'administrative', etc.
//                   geoClass = geoData[0].class; // e.g., 'boundary', 'place', etc.
//                   geoDisplayName = geoData[0].display_name || '';
//                 } catch (e) {
//                   alert("Failed to look up location coordinates. Please try again later.");
//                   return;
//                 }
//                 if (!navigator.geolocation) {
//                   alert("Geolocation is not supported by your browser.");
//                   return;
//                 }
//                 navigator.geolocation.getCurrentPosition(async (position) => {
//                   const { latitude, longitude } = position.coords;
//                   // Use 1000km for country or administrative boundary with matching name, 50km for city/other
//                   let radius = 50;
//                   if (
//                     geoType === 'country' ||
//                     (geoClass === 'boundary' && geoType === 'administrative' && geoDisplayName.toLowerCase().includes(cap.triggerValue.toLowerCase()))
//                   ) {
//                     radius = 1000;
//                   }
//                   const distance = getDistanceFromLatLonInKm(latitude, longitude, loc.lat, loc.lng);
//                   if (distance > radius) {
//                     alert(`You are not in the expected location (${cap.triggerValue}). Please travel to ${cap.triggerValue} to open this capsule.`);
//                     setActivityLog((prev) => [
//                       `❌ Check-in failed: Not in ${cap.triggerValue} (distance: ${distance.toFixed(1)} km, allowed: ${radius} km)`,
//                       ...prev
//                     ]);
//                     return;
//                   }
//                   const userId = cap.userId;
//                   const res = await API.post("/capsule/checkin", { userId, location: cap.triggerValue, latitude, longitude });
//                   if (res.data.delivered) {
//                     alert(res.data.message);
//                     setActivityLog((prev) => [
//                       `📍 Checked in at ${cap.triggerValue}: ${res.data.message}`,
//                       ...prev
//                     ]);
//                   }
//                   fetchCapsules();
//                 }, (error) => {
//                   alert("Could not get your location. Please allow location access and try again.");
//                 });
//               };

//               return (
//                 <div key={cap.id} className={`capsule-card ${cap.isDelivered ? "delivered" : "locked"}`}>
//                   <h3>{cap.title}</h3>
//                   <p className="status">{cap.isDelivered ? "📬 Delivered" : "🔒 Locked"}</p>
//                   <p><strong>Trigger:</strong> {cap.triggerType} – {cap.triggerValue}</p>

//                   {/* Only show countdown for date-based locked capsules */}
//                   {!cap.isDelivered && cap.triggerType === "date" && (
//                     <>
//                       <div className="progress-bar-container">
//                         <div className="progress-bar" style={{ width: `${progress}%` }} />
//                       </div>
//                       <p className="countdown-text">⏳ Unlocks in: <strong>{timeLeft}</strong></p>
//                     </>
//                   )}

//                   {/* Only show check-in button for locked location capsules */}
//                   {!cap.isDelivered && cap.triggerType === "location" && (
//                     <div style={{ margin: '12px 0' }}>
//                       <button onClick={handleLocationCheckIn} className="checkin-button">
//                         📍 Simulate Check-in at {cap.triggerValue}
//                       </button>
//                     </div>
//                   )}

//                   {expandedId === cap.id && (
//                     <p className="capsule-message">{cap.message}</p>
//                   )}

//                   <div className="capsule-actions">
//                     <button onClick={() => handleViewMessage(cap.id)} className="view-button">
//                       {expandedId === cap.id ? <FaEyeSlash /> : <FaEye />} {expandedId === cap.id ? "Hide" : "View"}
//                     </button>
//                     <button onClick={() => handleDeleteCapsule(cap.id)} className="delete-button">
//                       <FaTrash /> Delete
//                     </button>
//                     <button onClick={() => handleShare(cap.id)} className="share-button">
//                       <FaShareAlt /> Share
//                     </button>
//                   </div>

//                   <div className="rating-container">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <FaStar key={star} className="star-icon" onClick={() => handleRating(cap.id, star)} />
//                     ))}
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       )}

//       <div className="activity-timeline">
//         <h3>🕓 Activity Timeline</h3>
//         <ul>
//           {activityLog.slice(0, 6).map((entry, index) => (
//             <li key={index}>{entry}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }


// CapsuleList.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import confetti from "canvas-confetti";
import { ClipLoader } from "react-spinners";
import { FaShareAlt, FaStar, FaTrash, FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import "./CapsuleList.css";

export default function CapsuleList() {
  const [capsules, setCapsules] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const deliveredCapsules = useRef(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openedCount, setOpenedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activityLog, setActivityLog] = useState([]);

  const fetchCapsules = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/capsule/mine");
      setCapsules(res.data);

      const opened = res.data.filter((cap) => cap.isDelivered).length;
      const pending = res.data.length - opened;
      setOpenedCount(opened);
      setPendingCount(pending);

      const newLog = [];
      res.data.forEach((cap) => {
        if (cap.isDelivered && !deliveredCapsules.current.has(cap.id)) {
          deliveredCapsules.current.add(cap.id);
          confetti({ particleCount: 70, spread: 100, origin: { y: 0.6 } });
          newLog.push(`📬 Opened capsule "${cap.title}"`);
        }
      });
      setActivityLog((prev) => [...newLog, ...prev]);
    } catch (error) {
      console.error("Error fetching capsules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapsules();
    const fetchInterval = setInterval(fetchCapsules, 60000);
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedMap = {};
      capsules.forEach((cap) => {
        if (!cap.isDelivered && cap.triggerType === "date") {
          const now = new Date();
          const target = new Date(cap.triggerValue);
          const diff = Math.max(0, target - now);
          const seconds = Math.floor((diff / 1000) % 60);
          const minutes = Math.floor((diff / 1000 / 60) % 60);
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          updatedMap[cap.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
      });
      setTimeLeftMap(updatedMap);
    }, 1000);
    return () => clearInterval(interval);
  }, [capsules]);

  const handleDeleteCapsule = async (id) => {
    try {
      await API.delete(`/api/capsule/${id}`);
      alert("Capsule deleted successfully.");
      setActivityLog((prev) => [`❌ Deleted capsule ID ${id}`, ...prev]);
      fetchCapsules();
    } catch (error) {
      console.error("Error deleting capsule:", error);
      alert("Failed to delete capsule.");
    }
  };

  const handleShare = (id) => {
    const shareUrl = `${window.location.origin}/capsule/${id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Capsule link copied!");
    setActivityLog((prev) => [`🔗 Shared capsule ID ${id}`, ...prev]);
  };

  const handleRating = (id, rating) => {
    alert(`You rated capsule ID ${id} with ${rating} stars!`);
    setActivityLog((prev) => [`⭐ Rated capsule ${id} with ${rating} stars`, ...prev]);
  };

  const handleViewMessage = async (id) => {
    // Always fetch latest capsules before showing message
    try {
      const res = await API.get("/api/capsule/mine");
      const latestCapsules = res.data;
      const capsule = latestCapsules.find((cap) => cap.id === id);
      if (capsule && capsule.isDelivered) {
        setCapsules(latestCapsules); // update state so UI is in sync
        setExpandedId(expandedId === id ? null : id);
      } else {
        alert("Capsule will open after the trigger date.");
      }
    } catch (err) {
      alert("Failed to check capsule status. Please try again.");
    }
  };

  const calculateProgress = (cap) => {
    if (cap.isDelivered || cap.triggerType !== "date") return 100;
    const triggerTime = new Date(cap.triggerValue).getTime();
    const createdTime = new Date(cap.createdAt).getTime();
    const now = new Date().getTime();
    const total = triggerTime - createdTime;
    const elapsed = now - createdTime;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const filteredCapsules = capsules.filter((cap) =>
    cap.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Haversine formula to calculate distance between two lat/lng points in km
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      0.5 - Math.cos(dLat)/2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  // Simulated location check-in for Paris using real GPS
  const handleParisCheckIn = async () => {
    // Paris coordinates
    const parisLat = 48.8566;
    const parisLng = 2.3522;
    try {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInKm(latitude, longitude, parisLat, parisLng);
        if (distance > 50) { // 50km radius
          alert("You are not in the expected location (Paris). Please travel to Paris to open this capsule.");
          setActivityLog((prev) => [
            `❌ Check-in failed: Not in Paris (distance: ${distance.toFixed(1)} km)`,
            ...prev
          ]);
          return;
        }
        // Assume userId is available in the first capsule (or get from auth context if available)
        const userId = capsules[0]?.userId;
        if (!userId) {
          alert("User ID not found. Please refresh or log in again.");
          return;
        }
        const res = await API.post("/api/capsule/checkin", { userId, location: "Paris", latitude, longitude });
        alert(res.data.message);
        fetchCapsules();
        setActivityLog((prev) => [
          `📍 Checked in at Paris: ${res.data.message}`,
          ...prev
        ]);
      }, (error) => {
        alert("Could not get your location. Please allow location access and try again.");
      });
    } catch (err) {
      alert("Failed to check in at Paris. Please try again.");
    }
  };

  return (
    <div className="capsule-list-container">
      <div className="capsule-summary">
        <h2>📦 Capsule Summary</h2>
        <p>Total: {capsules.length} | 📬 Opened: {openedCount} | 🔒 Pending: {pendingCount}</p>
        <div className="summary-bars">
          <div className="bar opened" style={{ width: `${(openedCount / capsules.length) * 100 || 0}%` }} />
          <div className="bar pending" style={{ width: `${(pendingCount / capsules.length) * 100 || 0}%` }} />
        </div>
      </div>

      <div className="capsule-list-header">
        <h2>🎁 My Capsules</h2>
        <button onClick={fetchCapsules} className="refresh-button">
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Search capsules..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-bar"
      />

      {loading ? (
        <div className="spinner-container">
          <ClipLoader size={50} color="#4A90E2" />
        </div>
      ) : (
        <div className="capsule-grid">
          {filteredCapsules.length === 0 ? (
            <p>No capsules found.</p>
          ) : (
            filteredCapsules.map((cap) => {
              const progress = calculateProgress(cap);
              const timeLeft = timeLeftMap[cap.id];

              // Per-capsule check-in handler for location capsules (now supports any location)
              const handleLocationCheckIn = async () => {
                if (!cap.triggerValue) {
                  alert("No location set for this capsule.");
                  return;
                }
                // 1. Geocode the location name to get lat/lng and type
                let loc, geoType, geoClass, geoDisplayName;
                try {
                  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cap.triggerValue)}`);
                  const geoData = await geoRes.json();
                  if (!geoData.length) {
                    alert(`Could not find coordinates for '${cap.triggerValue}'. Please check the location name.`);
                    return;
                  }
                  loc = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
                  geoType = geoData[0].type; // e.g., 'country', 'city', 'village', 'administrative', etc.
                  geoClass = geoData[0].class; // e.g., 'boundary', 'place', etc.
                  geoDisplayName = geoData[0].display_name || '';
                } catch (e) {
                  alert("Failed to look up location coordinates. Please try again later.");
                  return;
                }
                if (!navigator.geolocation) {
                  alert("Geolocation is not supported by your browser.");
                  return;
                }
                navigator.geolocation.getCurrentPosition(async (position) => {
                  const { latitude, longitude } = position.coords;
                  // Use 1000km for country or administrative boundary with matching name, 50km for city/other
                  let radius = 50;
                  if (
                    geoType === 'country' ||
                    (geoClass === 'boundary' && geoType === 'administrative' && geoDisplayName.toLowerCase().includes(cap.triggerValue.toLowerCase()))
                  ) {
                    radius = 1000;
                  }
                  const distance = getDistanceFromLatLonInKm(latitude, longitude, loc.lat, loc.lng);
                  if (distance > radius) {
                    alert(`You are not in the expected location (${cap.triggerValue}). Please travel to ${cap.triggerValue} to open this capsule.`);
                    setActivityLog((prev) => [
                      `❌ Check-in failed: Not in ${cap.triggerValue} (distance: ${distance.toFixed(1)} km, allowed: ${radius} km)`,
                      ...prev
                    ]);
                    return;
                  }
                  const userId = cap.userId;
                  const res = await API.post("/api/capsule/checkin", { userId, location: cap.triggerValue, latitude, longitude });
                  if (res.data.delivered) {
                    alert(res.data.message);
                    setActivityLog((prev) => [
                      `📍 Checked in at ${cap.triggerValue}: ${res.data.message}`,
                      ...prev
                    ]);
                  }
                  fetchCapsules();
                }, (error) => {
                  alert("Could not get your location. Please allow location access and try again.");
                });
              };

              return (
                <div key={cap.id} className={`capsule-card ${cap.isDelivered ? "delivered" : "locked"}`}>
                  <h3>{cap.title}</h3>
                  <p className="status">{cap.isDelivered ? "📬 Delivered" : "🔒 Locked"}</p>
                  <p><strong>Trigger:</strong> {cap.triggerType} – {cap.triggerValue}</p>

                  {/* Only show countdown for date-based locked capsules */}
                  {!cap.isDelivered && cap.triggerType === "date" && (
                    <>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="countdown-text">⏳ Unlocks in: <strong>{timeLeft}</strong></p>
                    </>
                  )}

                  {/* Only show check-in button for locked location capsules */}
                  {!cap.isDelivered && cap.triggerType === "location" && (
                    <div style={{ margin: '12px 0' }}>
                      <button onClick={handleLocationCheckIn} className="checkin-button">
                        📍 Simulate Check-in at {cap.triggerValue}
                      </button>
                    </div>
                  )}

                  {expandedId === cap.id && (
                    <p className="capsule-message">{cap.message}</p>
                  )}

                  <div className="capsule-actions">
                    <button onClick={() => handleViewMessage(cap.id)} className="view-button">
                      {expandedId === cap.id ? <FaEyeSlash /> : <FaEye />} {expandedId === cap.id ? "Hide" : "View"}
                    </button>
                    <button onClick={() => handleDeleteCapsule(cap.id)} className="delete-button">
                      <FaTrash /> Delete
                    </button>
                    <button onClick={() => handleShare(cap.id)} className="share-button">
                      <FaShareAlt /> Share
                    </button>
                  </div>

                  <div className="rating-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar key={star} className="star-icon" onClick={() => handleRating(cap.id, star)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="activity-timeline">
        <h3>🕓 Activity Timeline</h3>
        <ul>
          {activityLog.slice(0, 6).map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
