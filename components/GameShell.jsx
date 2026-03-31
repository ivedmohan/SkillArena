"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Timer from "./Timer";
import LifeBar from "./LifeBar";
import ComboIndicator from "./ComboIndicator";
import ScorePopup from "./ScorePopup";
import { getAdaptiveDifficultyName } from "../engine/AdaptiveEngine";

/**
 * GameShell — Identical wrapper layout used by ALL game plugins.
 * Renders: [Timer] [Score] [Lives] [Combo] [Adaptive Badge] [Fullscreen] + the plugin area below.
 *
 * Props:
 *   session      — current engine session (score, lives, streak, multiplier, lastPointsEarned)
 *   config       — full game config object (meta + config)
 *   timeLimit    — seconds for the main countdown
 *   onTimerExpire — called when countdown reaches 0
 *   isActive     — false = freeze UI
 *   adaptive     — adaptive difficulty state from AdaptiveEngine
 *   children     — the plugin component renders here
 */
export default function GameShell({ session, config, timeLimit, onTimerExpire, isActive, adaptive, children }) {
  const meta = config?.meta ?? {};
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state changes
  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Adaptive difficulty badge
  const adaptiveLevel = adaptive?.level ?? 3;
  const adaptiveName = adaptive ? getAdaptiveDifficultyName(adaptive) : null;
  const adaptiveDirection = adaptive?.lastDirection;
  const adaptiveColor =
    adaptiveLevel <= 2 ? "#00ff88" :
    adaptiveLevel === 3 ? "#ffcc00" :
    "#ff0099";

  return (
    <div className={`min-h-screen flex flex-col bg-[#0f0f1a] text-white ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Score popup animation */}
      <ScorePopup points={session?.lastPointsEarned ?? 0} />

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Left: lives + combo + adaptive */}
        <div className="flex flex-col gap-1 min-w-[80px]">
          <LifeBar lives={session?.lives ?? 0} maxLives={meta.lives ?? 3} />
          {(session?.streak ?? 0) >= 3 && (
            <ComboIndicator multiplier={session?.multiplier ?? 1} streak={session?.streak ?? 0} />
          )}
          {/* Adaptive difficulty badge */}
          {adaptiveName && (
            <AnimatePresence mode="wait">
              <motion.div
                key={adaptiveLevel}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1"
              >
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color: adaptiveColor, background: `${adaptiveColor}15`, border: `1px solid ${adaptiveColor}30` }}
                >
                  {adaptiveName}
                  {adaptiveDirection === "up" && " ↑"}
                  {adaptiveDirection === "down" && " ↓"}
                </span>
              </motion.div>
            </AnimatePresence>
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

        {/* Right: game title + timer + fullscreen */}
        <div className="flex flex-col items-end gap-1 min-w-[100px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#8888aa] font-bold">
              {meta.title}
            </span>
            {/* Fullscreen toggle — Digital Board mode */}
            <button
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded-lg bg-[#ffffff08] border border-[#2a2a4a] hover:border-[#b44fff] hover:bg-[#b44fff]/10 text-[#8888aa] hover:text-white transition-all flex items-center justify-center text-sm"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen (Digital Board Mode)"}
            >
              {isFullscreen ? "⛶" : "⛶"}
            </button>
          </div>
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
