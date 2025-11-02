// src/components/VideoGrid.jsx
import React from "react";
import VideoTile from "./VideoTile";

const VideoGrid = ({ participants = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full p-4">
      {participants.length > 0 ? (
        participants.map((p) => (
          <VideoTile
            key={p.socketId || p.name} // ensures unique key
            stream={p.stream}
            name={p.name || "Guest"}
            isLocal={p.isLocal}
          />
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
          Waiting for participants...
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
