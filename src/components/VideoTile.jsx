// src/components/VideoTile.jsx
import React, { useEffect, useRef, useState } from "react";

const VideoTile = ({ stream, name = "Guest", isLocal = false }) => {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream instanceof MediaStream) {
      // Set the stream to the video element
      videoRef.current.srcObject = stream;
      
      // Try to play the video
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
            console.log(`✅ Video playing for ${name}`);
          })
          .catch((error) => {
            console.error(`Error playing video for ${name}:`, error);
            setIsLoading(false);
          });
      }
      
      // Check if stream has video tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      setHasVideo(videoTracks.length > 0 && videoTracks[0] && videoTracks[0].enabled);
      
      // Listen for track changes
      const handleTrackChange = () => {
        const tracks = stream.getVideoTracks();
        setHasVideo(tracks.length > 0 && tracks[0] && tracks[0].enabled);
        setIsLoading(false);
      };
      
      // Listen for track added/removed
      const handleTrackAdded = (event) => {
        if (event.track.kind === "video") {
          setHasVideo(true);
          setIsLoading(false);
          // Try to play if video was just added
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }
      };
      
      const handleTrackRemoved = (event) => {
        if (event.track.kind === "video") {
          const remainingVideoTracks = stream.getVideoTracks().filter(t => t !== event.track);
          setHasVideo(remainingVideoTracks.length > 0 && remainingVideoTracks[0]?.enabled);
        }
      };
      
      stream.addEventListener("addtrack", handleTrackAdded);
      stream.addEventListener("removetrack", handleTrackRemoved);
      
      videoTracks.forEach(track => {
        track.addEventListener("ended", handleTrackChange);
        track.addEventListener("mute", handleTrackChange);
        track.addEventListener("unmute", handleTrackChange);
      });
      
      return () => {
        stream.removeEventListener("addtrack", handleTrackAdded);
        stream.removeEventListener("removetrack", handleTrackRemoved);
        videoTracks.forEach(track => {
          track.removeEventListener("ended", handleTrackChange);
          track.removeEventListener("mute", handleTrackChange);
          track.removeEventListener("unmute", handleTrackChange);
        });
      };
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
      setHasVideo(false);
      setIsLoading(false);
    }
  }, [stream, name]);

  return (
    <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-3xl group">
      {/* Video Display */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? "opacity-100" : "opacity-0"}`}
      />

      {/* Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-2 border-4 border-blue-500 rounded-full animate-spin-reverse border-t-transparent"></div>
          </div>
        </div>
      )}

      {/* Fallback Avatar/Name with Animation */}
      {!hasVideo && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg animate-pulse-slow">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="text-gray-300 text-sm mt-2 animate-fade-in-delay">
            {isLocal ? "Your camera is off" : `${name}'s camera is off`}
          </p>
        </div>
      )}

      {/* Participant name tag with hover effect */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all duration-300 group-hover:bg-black/90">
        {isLocal && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        )}
        <span className="font-medium">{isLocal ? `${name} (You)` : name}</span>
      </div>

      {/* Audio indicator with animation */}
      {stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled && (
        <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full animate-pulse-slow">
          🔊
        </div>
      )}

      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoTile;
