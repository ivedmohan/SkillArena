"use client";
import { useEffect } from "react";
import { useTimer } from "../hooks/useTimer";

/**
 * Timer — shrinking countdown bar.
 * Turns red in last 5 seconds.
 */
export default function Timer({ duration, onExpire, active = true }) {
  const { remaining, progress } = useTimer(duration, onExpire, active);

  const isUrgent = remaining <= 5;
  const barColor = isUrgent
    ? "bg-[#ff0099]"
    : remaining <= 10
    ? "bg-yellow-400"
    : "bg-[#00ff88]";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#8888aa] uppercase tracking-widest">Time</span>
        <span
          className={`text-lg font-bold tabular-nums transition-colors ${
            isUrgent ? "text-[#ff0099]" : "text-[#f0f0f0]"
          }`}
        >
          {remaining}s
        </span>
      </div>

      <div className="w-full h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor} ${
            isUrgent ? "shadow-[0_0_8px_#ff0099]" : ""
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
