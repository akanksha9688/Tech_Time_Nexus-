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

export default API;





