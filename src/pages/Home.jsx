import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, createRoom } from "../utils/api";

const Home = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [roomCode, setRoomCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [networkError, setNetworkError] = useState("");

  // Check localStorage on component mount to restore authentication state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.username) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error parsing user data from localStorage:", err);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user types
    setError("");
    setNetworkError("");
  };

  const handleAuth = async () => {
    // Clear previous errors
    setError("");
    setNetworkError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login requires email and password
        if (!form.email || !form.password) {
          setError("Please enter email and password");
          setIsLoading(false);
          return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }
        
        const res = await loginUser({ 
          email: form.email.trim().toLowerCase(), 
          password: form.password 
        });
        
        if (res.data && res.data.success) {
          // Store user data properly in localStorage
          const userData = {
            username: res.data.username,
            email: form.email.trim().toLowerCase(),
            isAuthenticated: true,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem("user", JSON.stringify(userData));
          setIsAuthenticated(true);
          setForm({ username: "", email: "", password: "" }); // Clear form
          setError("");
          setNetworkError("");
        } else {
          setError(res.data?.message || "Login failed. Please try again.");
        }
      } else {
        // Registration requires username, email, and password
        if (!form.username || !form.email || !form.password) {
          setError("Please fill in all fields");
          setIsLoading(false);
          return;
        }
        
        // Validate username
        if (form.username.trim().length < 3) {
          setError("Username must be at least 3 characters long");
          setIsLoading(false);
          return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }
        
        // Validate password
        if (form.password.length < 6) {
          setError("Password must be at least 6 characters long");
          setIsLoading(false);
          return;
        }
        
        const res = await registerUser({
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        
        if (res.data && res.data.success) {
          setError("");
          alert("✅ Registration successful! Please log in.");
          setIsLogin(true);
          setForm({ username: "", email: "", password: "" }); // Clear form
        } else {
          setError(res.data?.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      // Handle network errors
      if (err.code === "ERR_NETWORK" || err.message === "Network Error" || !err.response) {
        setNetworkError("Network Error: Cannot connect to server. Please check your internet connection and ensure the backend server is running.");
      } else if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || err.response.statusText || "An error occurred";
        setError(errorMessage);
        
        if (err.response.status >= 500) {
          setNetworkError("Server Error: Please try again later.");
        } else if (err.response.status === 404) {
          setNetworkError("Server not found. Please check if the backend server is running.");
        }
      } else {
        setError(err.message || "Authentication failed. Please try again!");
      }
      console.error("Authentication error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (roomCode.trim()) navigate(`/room/${roomCode}`);
    else alert("Enter a valid room code");
  };

  const handleCreate = async () => {
    try {
      const res = await createRoom();
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      const randomRoom = Math.random().toString(36).substring(2, 8);
      navigate(`/room/${randomRoom}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white">
      {/* Authentication Section */}
      {!isAuthenticated && (
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? "Welcome Back 👋" : "Create an Account ✨"}
          </h2>

          {/* Network Error Display */}
          {networkError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
              <p className="text-red-200 text-sm font-semibold">⚠️ {networkError}</p>
              <p className="text-red-300/80 text-xs mt-1">
                Make sure MongoDB Compass is running and backend server is started on port 5000
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && !networkError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
              <p className="text-red-200 text-sm">❌ {error}</p>
            </div>
          )}

          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full mb-3 p-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full mb-3 p-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full mb-5 p-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full bg-pink-600 hover:bg-pink-700 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? "Logging in..." : "Registering..."}
              </>
            ) : (
              isLogin ? "Login" : "Register"
            )}
          </button>

          <p
            className="mt-4 text-center text-sm cursor-pointer text-pink-200 hover:text-white"
            onClick={() => {
              if (!isLoading) {
                setIsLogin(!isLogin);
                setError("");
                setNetworkError("");
              }
            }}
          >
            {isLogin ? "Create an account" : "Already have an account? Login"}
          </p>
        </div>
      )}

      {/* Room Section — visible only after login */}
      {isAuthenticated && (
        <div className="bg-white/10 backdrop-blur-md mt-8 p-6 rounded-2xl shadow-xl w-full max-w-md border border-white/20">
          {/* User Info */}
          {(() => {
            const storedUser = localStorage.getItem("user");
            const userData = storedUser ? JSON.parse(storedUser) : null;
            return userData && userData.username ? (
              <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                <p className="text-green-200 text-sm font-semibold">
                  ✅ Logged in as: <span className="text-white">{userData.username}</span>
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem("user");
                    setIsAuthenticated(false);
                    setForm({ username: "", email: "", password: "" });
                    setError("");
                    setNetworkError("");
                  }}
                  className="mt-2 text-xs text-pink-200 hover:text-white underline"
                >
                  Logout
                </button>
              </div>
            ) : null;
          })()}
          
          <h3 className="text-2xl font-semibold mb-4 text-center">
            Join or Create Room 🎥
          </h3>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full mb-3 p-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <div className="flex gap-4">
            <button
              onClick={handleJoin}
              className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold"
            >
              Join Room
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 py-2 rounded-lg font-semibold"
            >
              Create Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
