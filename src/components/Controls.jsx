// src/components/Controls.jsx
import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
} from "lucide-react";

const Controls = ({
  muted,
  camOff,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onEndCall,
}) => {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* 🎙️ Mic Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-3 rounded-full transition-all duration-200 ${
          muted
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gray-700 hover:bg-gray-600"
        }`}
        title={muted ? "Unmute Mic" : "Mute Mic"}
      >
        {muted ? (
          <MicOff size={22} className="text-white" />
        ) : (
          <Mic size={22} className="text-white" />
        )}
      </button>

      {/* 🎥 Camera Toggle */}
      <button
        onClick={onToggleCam}
        className={`p-3 rounded-full transition-all duration-200 ${
          camOff
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gray-700 hover:bg-gray-600"
        }`}
        title={camOff ? "Turn On Camera" : "Turn Off Camera"}
      >
        {camOff ? (
          <VideoOff size={22} className="text-white" />
        ) : (
          <Video size={22} className="text-white" />
        )}
      </button>

      {/* 🖥️ Screen Share */}
      <button
        onClick={onShareScreen}
        className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200"
        title="Share Screen"
      >
        <ScreenShare size={22} className="text-white" />
      </button>

      {/* 🔚 End Call */}
      <button
        onClick={onEndCall}
        className="p-3 bg-red-700 hover:bg-red-800 rounded-full transition-all duration-200"
        title="End Call"
      >
        <PhoneOff size={22} className="text-white" />
      </button>
    </div>
  );
};

export default Controls;
