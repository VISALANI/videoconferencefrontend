import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Feedback = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emojis = [
    { icon: "😡", label: "Terrible" },
    { icon: "😕", label: "Poor" },
    { icon: "😐", label: "Okay" },
    { icon: "😊", label: "Good" },
    { icon: "🤩", label: "Excellent" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating) {
      alert("Please select a rating!");
      return;
    }

    // Simulate submission
    console.log({
      roomId,
      rating,
      comment,
    });

    setSubmitted(true);

    setTimeout(() => navigate("/"), 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-hero text-white text-center px-4">
        <h2 className="text-3xl font-bold mb-4 animate-pulse">
          🎉 Thank You for Your Feedback!
        </h2>
        <p className="text-lg opacity-90">
          Redirecting you to the homepage...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-hero text-white px-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full hover-card">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Share Your Experience 💬
        </h1>
        <p className="text-sm text-center text-white/80 mb-6">
          How was your call session for Room <span className="font-semibold">{roomId}</span>?
        </p>

        {/* Emoji Rating */}
        <div className="flex justify-between mb-6">
          {emojis.map((e, index) => (
            <button
              key={index}
              onClick={() => setRating(e.label)}
              className={`text-3xl transition-transform ${
                rating === e.label
                  ? "scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                  : "opacity-70 hover:scale-110"
              }`}
            >
              {e.icon}
            </button>
          ))}
        </div>

        {/* Comment Box */}
        <textarea
          placeholder="Leave a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300 mb-4"
          rows={4}
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="btn-gradient w-full py-2 rounded-lg font-semibold text-lg"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default Feedback;
