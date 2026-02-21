"use client";
import { motion, AnimatePresence } from "framer-motion";
import { getComboMultiplier } from "../engine/gameEngine";

/**
 * ComboIndicator — shows active combo streak and multiplier.
 * Pops in with a spring animation when combo changes.
 */
export default function ComboIndicator({ combo }) {
  const streak = Math.max(0, combo - 1); // combo=1 means no streak yet
  const multiplier = getComboMultiplier(streak);
  const isActive = multiplier > 1;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={combo}
          initial={{ scale: 0.5, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a2e] border border-[#b44fff] shadow-[0_0_12px_#b44fff55]"
        >
          <span className="text-[#b44fff] font-bold text-sm">🔥 {streak} streak</span>
          <span className="text-[#00ff88] font-black text-base">{multiplier}x</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
