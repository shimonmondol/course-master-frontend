import axios from "axios";
import { getToken, clearToken } from "../utils/auth";

// API Base URL - VITE .env থেকে রিড করবে, ফলব্যাক হিসেবে লোকালহোস্ট
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - automatically add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // টোকেনে যদি আগে থেকেই 'Bearer ' না থাকে, তবে তা যুক্ত করে পাঠানো
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // শুধুমাত্র লগইন পেজ ব্যতীত অন্য কোথাও ৪০১ পেলে সেশন ক্লিয়ার করে রিডাইরেক্ট করবে
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      clearToken();
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;