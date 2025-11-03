// src/utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://videoconferencebackend-1.onrender.com";

// 🔹 Initialize socket connection (lazy connect)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
});

// 🔹 Debug logs
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
  if (reason === "io server disconnect") {
    // Server disconnected the socket, need to manually reconnect
    socket.connect();
  }
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Socket connection error:", err.message);
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_error", (err) => {
  console.error("⚠️ Socket reconnection error:", err.message);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Socket reconnection failed");
});

export default socket;
