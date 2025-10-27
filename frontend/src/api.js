// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:5000/api", // adjust if needed
// });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// });

// export default API;


// 2
// import axios from "axios";

// const API = axios.create({
//   baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, // uses environment variable
// });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// });

// export default API;

// 3
import axios from "axios";

// ✅ Choose baseURL depending on environment
const API = axios.create({
  baseURL:
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:5000/api", // fallback for local dev
});

// ✅ Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle auth errors globally: clear token and redirect to login on 401/403
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem("token");
      } catch (e) {
        // ignore
      }
      // Inform user and redirect to login page
      alert("Session expired or unauthorized. Please log in again.");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;





