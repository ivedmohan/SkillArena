"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Assuming we want a purely visual component that receives props from parent 
// usually. But the existing one had logic inside. I'll respect the existing
// interface but make it look better.

export default function Timer({ duration, onExpire, active }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!active || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, timeLeft, onExpire]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="w-full relative group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8888aa] group-hover:text-white transition-colors">
          Time Remaining
        </span>
        <span className={`font-black text-xl tabular-nums drop-shadow-sm ${
          isUrgent ? "text-[#ff0099] animate-pulse" : "text-white"
        }`}>
          {timeLeft}
          <span className="text-xs font-medium text-[#8888aa] ml-0.5">s</span>
        </span>
      </div>

      <div className="h-4 w-full bg-[#0f0f1a] rounded-full overflow-hidden border border-[#2a2a4a] relative shadow-inner">
        <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 1 }}
            className={`h-full rounded-full relative overflow-hidden ${
                isUrgent ? "bg-gradient-to-l from-[#ff0099] to-[#b44fff]" : "bg-gradient-to-l from-[#00ff88] to-[#00cc6a]"
            }`}
        >
             {/* Shine effect */}
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}
