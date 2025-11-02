import React, { useState, useEffect } from "react";
import { Sun, Moon, Video, LogIn, UserPlus, Home } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toggleTheme, applyStoredTheme } from "../utils/theme"; // ✅ fixed import

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    applyStoredTheme(); // ✅ apply stored theme on load
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setDarkMode(!darkMode);
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 dark:text-blue-400 font-semibold"
      : "hover:text-blue-500";

  return (
    <nav className="flex flex-wrap items-center justify-between px-6 py-4 bg-white/30 dark:bg-gray-900/40 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300">
      {/* Logo Section */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Video className="text-blue-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">
          VidMeet
        </h1>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-wrap items-center gap-5 text-gray-700 dark:text-gray-300 font-medium">
        <Link to="/" className={`flex items-center gap-1 ${isActive("/")}`}>
          <Home size={18} /> Home
        </Link>

        <Link
          to="/login"
          className={`flex items-center gap-1 ${isActive("/login")}`}
        >
          <LogIn size={18} /> Login
        </Link>

        <Link
          to="/register"
          className={`flex items-center gap-1 ${isActive("/register")}`}
        >
          <UserPlus size={18} /> Register
        </Link>

        <button
          onClick={() => navigate("/create-room")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all"
        >
          Create Room
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:scale-110 transition-transform"
          title="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="text-yellow-400" />
          ) : (
            <Moon className="text-gray-700" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
