// src/pages/Room.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import VideoTile from "../components/VideoTile";
import ChatBox from "../components/ChatBox";
import Controls from "../components/Controls";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});

  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.username || "guest",
          name: userData.username || "Guest",
        });
      } catch (err) {
        setUser({ id: "guest", name: "Guest" });
      }
    } else {
      setUser({ id: "guest", name: "Guest" });
    }
  }, []);

  const upsertPeer = (socketId, stream, userData = null) => {
    setPeers((prev) => {
      const exists = prev.find((p) => p.socketId === socketId);
      if (exists) {
        return prev.map((p) =>
          p.socketId === socketId
            ? { ...p, stream: stream || p.stream, user: userData || p.user }
            : p
        );
      }
      return [...prev, { socketId, stream, user: userData }];
    });
  };

  const removePeer = (socketId) => {
    setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    if (peerConnections.current[socketId]) {
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
  };

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    // Socket connection handlers
    const handleConnect = () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
      setError("");
      
      if (user) {
        socket.emit("join-room", { roomId, user });
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
      setError("Connection lost. Attempting to reconnect...");
    };

    const handleError = (errorData) => {
      console.error("Socket error:", errorData);
      setError(errorData.message || "An error occurred");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    // Initialize local stream
    startLocalStream();

    // Socket event handlers
    socket.on("all-users", (users) => {
      console.log("All users in room:", users);
      setPeers(
        users
          .filter(({ socketId }) => socketId !== socket.id)
          .map(({ socketId, user: remoteUser }) => ({
            socketId,
            stream: null,
            user: remoteUser,
          }))
      );
      
      users.forEach(({ socketId, user: remoteUser }) => {
        if (socketId !== socket.id) {
          console.log(`Creating offer for ${remoteUser?.name || socketId}`);
          createOffer(socketId, remoteUser);
        }
      });
      setIsLoading(false);
    });

    socket.on("user-joined", ({ socketId, user: remoteUser }) => {
      console.log("User joined:", remoteUser?.name || socketId);
      if (socketId !== socket.id) {
        setPeers((prev) => {
          const exists = prev.find((p) => p.socketId === socketId);
          if (!exists) {
            return [...prev, { socketId, stream: null, user: remoteUser }];
          }
          return prev;
        });
        console.log(`Creating offer for new user ${remoteUser?.name || socketId}`);
        createOffer(socketId, remoteUser);
      }
    });

    socket.on("offer", async ({ from, sdp }) => {
      try {
        console.log(`📥 Receiving offer from ${from}`);
        
        if (!localStreamRef.current) {
          console.warn(`⚠️ Local stream not ready when receiving offer from ${from}`);
          await startLocalStream();
        }
        
        let pc = peerConnections.current[from];
        if (!pc || pc.signalingState === "closed") {
          console.log(`Creating new peer connection for ${from}`);
          pc = createPeerConnection(from);
        } else {
          console.log(`Using existing peer connection for ${from}`);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log(`✅ Set remote description from ${from}`);
        
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        
        await pc.setLocalDescription(answer);
        console.log(`✅ Created and set local answer for ${from}`);
        
        socket.emit("answer", { target: from, sdp: pc.localDescription, roomId });
        console.log(`📤 Answer sent to ${from}`);
      } catch (err) {
        console.error(`❌ Error handling offer from ${from}:`, err);
      }
    });

    socket.on("answer", async ({ from, sdp }) => {
      try {
        console.log(`Receiving answer from ${from}`);
        const pc = peerConnections.current[from];
        if (pc && pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log(`Answer processed for ${from}`);
        } else {
          console.warn(`No peer connection found for ${from} or connection is closed`);
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      try {
        const pc = peerConnections.current[from];
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("receive-message", (payload) => {
      setMessages((m) => [...m, payload]);
    });

    socket.on("user-left", ({ socketId }) => {
      console.log("User left:", socketId);
      removePeer(socketId);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("receive-message");
      socket.off("user-left");
      
      cleanupAll();
    };
  }, [roomId, user]);

  // 🎥 Local Media with proper error handling
  async function startLocalStream() {
    if (isRequestingMedia) return; // Prevent multiple simultaneous requests
    
    setIsRequestingMedia(true);
    setCameraError("");
    
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera and microphone are not supported in this browser");
      }

      // Request media with fallback constraints
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop previous stream if exists
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force play
        localVideoRef.current.play().catch(console.error);
      }
      
      setError("");
      setCameraError("");
      setIsRequestingMedia(false);
      
      // Update cam state based on actual track state
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        setCamOff(!videoTracks[0].enabled);
      }
      
      console.log("✅ Camera and microphone access granted");
    } catch (err) {
      console.error("Error accessing media:", err);
      setIsRequestingMedia(false);
      
      let errorMessage = "Unable to access camera and microphone.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera and microphone access was denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera or microphone found. Please connect a device and try again.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Camera or microphone is already in use by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera constraints could not be satisfied. Trying with default settings...";
        // Retry with simpler constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          localStreamRef.current = fallbackStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = fallbackStream;
            localVideoRef.current.play().catch(console.error);
          }
          setError("");
          setCameraError("");
          setIsRequestingMedia(false);
          return;
        } catch (fallbackErr) {
          errorMessage = "Failed to access camera. Please check your device permissions.";
        }
      }
      
      setError(errorMessage);
      setCameraError(errorMessage);
    }
  }

  // 🧠 Create Peer Connection
  function createPeerConnection(remoteSocketId) {
    if (peerConnections.current[remoteSocketId]) {
      const oldPc = peerConnections.current[remoteSocketId];
      oldPc.close();
      delete peerConnections.current[remoteSocketId];
      console.log(`Closed existing connection for ${remoteSocketId}`);
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnections.current[remoteSocketId] = pc;

    const remoteStream = new MediaStream();
    pc.remoteStream = remoteStream;

    pc.ontrack = (event) => {
      console.log(`🎥 Received ${event.track.kind} track from ${remoteSocketId}`);
      
      event.streams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          const existingTrack = remoteStream.getTracks().find((t) => t.id === track.id);
          if (!existingTrack) {
            remoteStream.addTrack(track);
            console.log(`✅ Added ${track.kind} track to stream for ${remoteSocketId}`);
          }
        });
      });
      
      setPeers((prev) => {
        const updated = prev.map((p) => {
          if (p.socketId === remoteSocketId) {
            return { ...p, stream: remoteStream, user: p.user };
          }
          return p;
        });
        
        const exists = updated.some((p) => p.socketId === remoteSocketId);
        if (!exists) {
          const userInfo = prev.find((p) => p.socketId === remoteSocketId)?.user || { id: remoteSocketId, name: "Guest" };
          updated.push({ socketId: remoteSocketId, stream: remoteStream, user: userInfo });
        }
        
        return updated;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: remoteSocketId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🔌 ICE connection state for ${remoteSocketId}:`, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state for ${remoteSocketId}:`, pc.connectionState);
      if (pc.connectionState === "failed") {
        removePeer(remoteSocketId);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }

  async function createOffer(remoteSocketId, remoteUser) {
    try {
      console.log(`📡 Creating offer for ${remoteUser?.name || remoteSocketId}`);
      
      setPeers((prev) => {
        const exists = prev.find((p) => p.socketId === remoteSocketId);
        if (exists && !exists.user) {
          return prev.map((p) =>
            p.socketId === remoteSocketId ? { ...p, user: remoteUser } : p
          );
        } else if (!exists) {
          return [...prev, { socketId: remoteSocketId, stream: null, user: remoteUser }];
        }
        return prev;
      });

      if (!localStreamRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!localStreamRef.current) {
          console.error(`❌ Local stream still not available`);
          return;
        }
      }

      const pc = createPeerConnection(remoteSocketId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      socket.emit("offer", {
        target: remoteSocketId,
        sdp: pc.localDescription,
        roomId,
      });
      
      console.log(`✅ Offer sent to ${remoteUser?.name || remoteSocketId}`);
    } catch (err) {
      console.error(`❌ Error creating offer:`, err);
    }
  }

  // 🎙️ Controls
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMuted((m) => !m);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setCamOff((c) => !c);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(console.error);
      }

      screenTrack.onended = restoreCamera;
    } catch (err) {
      console.warn("Screen share canceled:", err);
    }
  };

  const restoreCamera = async () => {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const camTrack = camStream.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });

      const audioTracks = localStreamRef.current?.getAudioTracks() || [];
      const newLocal = new MediaStream([camTrack, ...audioTracks]);
      localStreamRef.current = newLocal;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newLocal;
        localVideoRef.current.play().catch(console.error);
      }
    } catch (err) {
      console.error("Error restoring camera:", err);
    }
  };

  const endCall = () => {
    cleanupAll();
    navigate("/");
  };

  const sendMessage = (text) => {
    if (!text.trim() || !user) return;
    const payload = { roomId, message: text.trim(), user };
    socket.emit("send-message", payload);
    setMessages((m) => [...m, payload]);
  };

  const cleanupAll = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnections.current).forEach((pc) => {
      if (pc) pc.close();
    });
    peerConnections.current = {};
    setPeers([]);
    if (socket.connected) {
      socket.emit("leave-room", { roomId });
    }
  };

  // Combine local and remote videos for display
  const allVideos = [
    { socketId: "local", stream: localStreamRef.current, user, isLocal: true },
    ...peers.filter((p) => p.stream !== null),
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Animated Header */}
      <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between border-b border-white/10 animate-fade-in">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold animate-slide-in-left">Video Conference</h1>
          <div className="flex items-center gap-2 text-sm animate-pulse-slow">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <span className="transition-colors duration-300">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 animate-slide-in-right">
          <span className="text-sm text-gray-300">
            Room: <span className="font-mono font-semibold">{roomId}</span>
          </span>
          <span className="text-sm text-gray-300">
            Participants: <span className="font-semibold animate-count-up">{allVideos.length}</span>
          </span>
        </div>
      </div>

      {/* Error Banner with Animation */}
      {(error || cameraError) && (
        <div className="bg-red-500/20 border-b border-red-500/50 p-3 text-center text-sm text-red-200 animate-slide-down">
          <div className="flex items-center justify-center gap-2">
            <span className="animate-bounce">⚠️</span>
            <span>{error || cameraError}</span>
            {cameraError && (
              <button
                onClick={startLocalStream}
                className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Video Grid with Animation */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <div className="text-center animate-pulse">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
                  <div className="absolute inset-2 border-4 border-blue-500 rounded-full animate-spin-reverse border-t-transparent"></div>
                </div>
                <p className="text-gray-300 animate-fade-in-delay">Connecting to room...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-2 custom-scrollbar">
              {allVideos.map((peer, index) => (
                <div
                  key={peer.socketId}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <VideoTile
                    stream={peer.stream}
                    name={peer.user?.name || "Guest"}
                    isLocal={peer.isLocal}
                  />
                </div>
              ))}
              {allVideos.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-full animate-fade-in">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">👥</div>
                    <p className="text-gray-400">Waiting for participants...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar with Animation */}
        <div className="w-80 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="animate-pulse-slow">💬</span> Chat
            </h3>
          </div>
          <ChatBox messages={messages} onSend={sendMessage} user={user} />
        </div>
      </div>

      {/* Animated Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-4 border-t border-white/10 animate-fade-in-up-delay">
        <Controls
          muted={muted}
          camOff={camOff}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onShareScreen={shareScreen}
          onEndCall={endCall}
        />
      </div>

      {/* Add Custom Animations via Style Tag */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes count-up {
          from { transform: scale(1); }
          50% { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
        .animate-count-up {
          animation: count-up 0.5s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
