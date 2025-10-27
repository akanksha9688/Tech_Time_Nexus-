// // analyticsService.js
// import axios from "axios";

// export const fetchAnalytics = async () => {
//   try {
//     const response = await axios.get("http://localhost:5000/api/analytics");  // Ensure this URL matches your backend
//     console.log("Fetched Analytics Data:", response.data);  // Log the response for debugging
    
//     // Ensure the response data contains the expected structure
//     if (
//       response.data &&
//       Array.isArray(response.data.created) &&
//       Array.isArray(response.data.opened) &&
//       Array.isArray(response.data.reminders)
//     ) {
//       return response.data;
//     } else {
//       throw new Error("Invalid data structure received from the API");
//     }
//   } catch (error) {
//     // Log detailed error info
//     console.error("Error fetching analytics:", error.message);
//     console.error(error.stack);
    
//     // Optionally, return fallback data to avoid crashing the UI
//     return {
//       created: [],
//       opened: [],
//       reminders: [],
//     };
//   }
// };




// analyticsService.js
import axios from "axios";

export const fetchAnalytics = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/analytics`);  // Uses environment variable
    console.log("Fetched Analytics Data:", response.data);  // Log the response for debugging
    
    // Ensure the response data contains the expected structure
    if (
      response.data &&
      Array.isArray(response.data.created) &&
      Array.isArray(response.data.opened) &&
      Array.isArray(response.data.reminders)
    ) {
      return response.data;
    } else {
      throw new Error("Invalid data structure received from the API");
    }
  } catch (error) {
    // Log detailed error info
    console.error("Error fetching analytics:", error.message);
    console.error(error.stack);
    
    // Optionally, return fallback data to avoid crashing the UI
    return {
      created: [],
      opened: [],
      reminders: [],
    };
  }
};

