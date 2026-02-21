"use client";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LifeBar — shows remaining lives as hearts.
 */
export default function LifeBar({ lives, maxLives = 3 }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[#8888aa] uppercase tracking-widest mr-1">Lives</span>
      {Array.from({ length: maxLives }).map((_, i) => {
        const alive = i < lives;
        return (
          <AnimatePresence key={i}>
            <motion.span
              key={`${i}-${alive}`}
              initial={alive ? { scale: 1 } : { scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={`text-2xl leading-none ${alive ? "drop-shadow-[0_0_6px_#ff0099]" : "opacity-20 grayscale"}`}
            >
              ❤️
            </motion.span>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
