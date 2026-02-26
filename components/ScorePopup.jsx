"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * ScorePopup — Floating +points animation shown when a correct answer is scored.
 * Triggers on any change to `points` (when points > 0).
 */
export default function ScorePopup({ points }) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!points || points <= 0) return;
    setDisplayed(points);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(t);
  }, [points]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={displayed}
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -40, scale: 1.1 }}
          exit={{ opacity: 0, y: -80, scale: 0.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <span className="text-2xl font-black text-[#00ff88] drop-shadow-[0_0_12px_rgba(0,255,136,0.8)]">
            +{displayed}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
