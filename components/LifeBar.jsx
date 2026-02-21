"use client";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LifeBar — shows remaining lives as hearts with cool animations.
 */
export default function LifeBar({ lives, maxLives = 3 }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8888aa] mb-1">
        Lives
      </span>
      <div className="flex items-center gap-1.5 bg-[#0f0f1a] px-3 py-1.5 rounded-full border border-[#2a2a4a] shadow-inner">
        {Array.from({ length: maxLives }).map((_, i) => {
          const alive = i < lives;
          return (
            <AnimatePresence key={i} mode="popLayout">
              <motion.span
                key={`${i}-${alive}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`text-xl leading-none transition-all duration-300 filter ${
                  alive 
                    ? "drop-shadow-[0_0_8px_#ff0099] grayscale-0 opacity-100" 
                    : "grayscale opacity-20 blur-[1px]"
                }`}
              >
                ❤️
              </motion.span>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}
