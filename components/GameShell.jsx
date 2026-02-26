"use client";
import { motion } from "framer-motion";
import Timer from "./Timer";
import LifeBar from "./LifeBar";
import ComboIndicator from "./ComboIndicator";
import ScorePopup from "./ScorePopup";

/**
 * GameShell — Identical wrapper layout used by ALL game plugins.
 * Renders: [Timer] [Score] [Lives] [Combo] + the plugin area below.
 *
 * Props:
 *   session      — current engine session (score, lives, streak, multiplier, lastPointsEarned)
 *   config       — full game config object (meta + config)
 *   timeLimit    — seconds for the main countdown
 *   onTimerExpire — called when countdown reaches 0
 *   isActive     — false = freeze UI
 *   children     — the plugin component renders here
 */
export default function GameShell({ session, config, timeLimit, onTimerExpire, isActive, children }) {
  const meta = config?.meta ?? {};

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f1a] text-white">
      {/* Score popup animation */}
      <ScorePopup points={session?.lastPointsEarned ?? 0} />

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Left: lives + combo */}
        <div className="flex flex-col gap-1 min-w-[80px]">
          <LifeBar lives={session?.lives ?? 0} maxLives={meta.lives ?? 3} />
          {(session?.streak ?? 0) >= 3 && (
            <ComboIndicator multiplier={session?.multiplier ?? 1} streak={session?.streak ?? 0} />
          )}
        </div>

        {/* Center: score */}
        <div className="flex flex-col items-center">
          <motion.span
            key={session?.score}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-2xl md:text-3xl font-black text-[#00ff88] tabular-nums drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]"
          >
            {session?.score ?? 0}
          </motion.span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#8888aa] font-semibold">Score</span>
        </div>

        {/* Right: game title + timer */}
        <div className="flex flex-col items-end gap-1 min-w-[100px]">
          <span className="text-[10px] uppercase tracking-widest text-[#8888aa] font-bold">
            {meta.title}
          </span>
          {timeLimit > 0 && (
            <Timer duration={timeLimit} onExpire={onTimerExpire} active={isActive} />
          )}
        </div>
      </div>

      {/* ── Plugin area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
