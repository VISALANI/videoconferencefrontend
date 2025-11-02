import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ✅ Vite configuration
export default defineConfig({
  plugins: [react()],

  // 📁 Path alias for cleaner imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },

  // 🌍 Server settings for local development
  server: {
    port: 5173,
    open: true, // automatically opens browser
    cors: true,
  },

  // ⚙️ Build configuration for production (Vercel/Netlify friendly)
  build: {
    outDir: "dist",
    sourcemap: false,
  },

  // 🧩 Optimize dependency pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios", "socket.io-client"],
  },
});
