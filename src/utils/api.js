// src/utils/api.js
import axios from "axios";

// Use the deployed backend URL from .env, or fallback to Render URL in production
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://videoconferencebackend-1.onrender.com/api";

// 🔹 Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Auth APIs
export const registerUser = async (data) => {
  return await api.post("/register", data);
};

export const loginUser = async (data) => {
  return await api.post("/login", data);
};

// 🔹 Room APIs
export const createRoom = async () => {
  return await api.post("/create-room");
};

// 🔹 Token setup (optional, for protected routes)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
