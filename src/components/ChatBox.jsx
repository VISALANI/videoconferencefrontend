import React, { useState, useEffect, useRef } from "react";

const ChatBox = ({ messages = [], onSend, user }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !onSend) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isCurrentUser = user && m.user?.id === user.id;
            return (
              <div
                key={i}
                className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    isCurrentUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-80">
                    {m.user?.name || "Guest"}
                  </div>
                  <div className="text-sm">{m.message}</div>
                  {m.timestamp && (
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input + Send */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            disabled={!onSend}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || !onSend}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
