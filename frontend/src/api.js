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