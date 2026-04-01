"use client";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isCorrect, calcPoints } from "./aptitudeLogic";
import { useTimer } from "../../hooks/useTimer";
import { GAME_CONFIG } from "../../constants/gameConfig";
import { getTimeAdjustment, getQuestionDifficultyFilter } from "../../engine/AdaptiveEngine";

const LABELS = ["A", "B", "C", "D"];

/**
 * AptitudeGame — MCQ plugin with adaptive difficulty support.
 *
 * Plugin interface:
 *   config      — game config.json data
 *   onCorrect   — (points) => void
 *   onWrong     — () => void
 *   onComplete  — () => void
 *   isActive    — false = freeze UI
 *   adaptive    — adaptive difficulty state (optional)
 */
export default function AptitudeGame({ config, onCorrect, onWrong, onComplete, isActive, adaptive }) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const questions = config.config.questions;
  const currentQ = questions[qIndex];
  const baseTimePerQ = config.meta.timePerQuestion ?? 15;

  // Apply adaptive time adjustment
  const timeAdjust = adaptive ? getTimeAdjustment(adaptive) : 0;
  const timePerQ = Math.max(5, baseTimePerQ + timeAdjust); // min 5 seconds

  const handleTimeout = useCallback(() => {
    if (revealed || !isActive) return;
    setRevealed(true);
    onWrong();
    scheduleNext();
  }, [revealed, isActive, qIndex, questions.length]); // eslint-disable-line

  const { remaining } = useTimer(timePerQ, handleTimeout, isActive && !revealed, timerKey);

  function scheduleNext() {
    setTimeout(() => {
      const nextIndex = qIndex + 1;
      if (nextIndex >= questions.length) {
        onComplete();
      } else {
        setQIndex(nextIndex);
        setSelected(null);
        setRevealed(false);
        setTimerKey(k => k + 1);
      }
    }, GAME_CONFIG.ANSWER_REVEAL_DURATION);
  }

  function handleAnswer(option) {
    if (revealed || !isActive) return;
    const secondsTaken = timePerQ - remaining;
    setSelected(option);
    setRevealed(true);

    if (isCorrect(currentQ, option)) {
      onCorrect(calcPoints(currentQ, secondsTaken));
    } else {
      onWrong();
    }
    scheduleNext();
  }

  // Determine question difficulty badge color
  const qDifficulty = currentQ.difficulty;
  const diffColor = qDifficulty === "hard" ? "#ff0099" : qDifficulty === "easy" ? "#00ff88" : "#ffcc00";

  return (
    <div className="flex flex-col h-full p-4 gap-4 max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-[#8888aa] font-mono">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-widest">{currentQ.topic}</span>
          {qDifficulty && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
              style={{ color: diffColor, background: `${diffColor}15`, border: `1px solid ${diffColor}30` }}
            >
              {qDifficulty}
            </span>
          )}
        </div>
        <span>{qIndex + 1} / {questions.length}</span>
      </div>

      {/* Per-question timer bar */}
      <div className="h-1.5 w-full bg-[#2a2a4a] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${remaining <= 5 ? "bg-[#ff0099]" : "bg-[#00ff88]"}`}
          animate={{ width: `${(remaining / timePerQ) * 100}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      {/* Adaptive time indicator */}
      {timeAdjust !== 0 && (
        <div className="flex justify-end">
          <span className={`text-[9px] font-bold ${timeAdjust > 0 ? "text-[#00ff88]" : "text-[#ff0099]"}`}>
            {timeAdjust > 0 ? `+${timeAdjust}s (adaptive)` : `${timeAdjust}s (adaptive)`}
          </span>
        </div>
      )}

      {/* Question + options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          className="flex flex-col gap-4 flex-1"
        >
          {/* Question text */}
          <div className="glass-panel rounded-2xl p-5 text-base md:text-lg font-semibold leading-relaxed text-white border border-white/5">
            {currentQ.question}
            {currentQ.imageUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-[#2a2a4a]">
                <img src={currentQ.imageUrl} alt="Question image" className="w-full max-h-48 object-cover hover:object-contain bg-black/50" />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isRight = revealed && opt === currentQ.answer;
              const isWrong = revealed && isSelected && opt !== currentQ.answer;

              return (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(opt)}
                  disabled={revealed || !isActive}
                  className={`flex items-center gap-3 p-4 rounded-xl border font-medium text-left transition-all ${
                    isRight  ? "border-[#00ff88] bg-[#00ff8820] text-[#00ff88]" :
                    isWrong  ? "border-[#ff0099] bg-[#ff009920] text-[#ff0099]" :
                    isSelected ? "border-[#b44fff] bg-[#b44fff20] text-white" :
                    "border-[#2a2a4a] bg-[#ffffff05] text-[#d0d0e0] hover:border-[#b44fff40] hover:bg-[#b44fff10]"
                  } ${revealed && !isRight && !isSelected ? "opacity-40" : ""}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#2a2a4a] flex items-center justify-center text-xs font-black text-[#8888aa] flex-shrink-0">
                    {LABELS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isRight && <span className="text-[#00ff88]">✓</span>}
                  {isWrong && <span className="text-[#ff0099]">✗</span>}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealed && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#8888aa] bg-[#ffffff08] rounded-xl p-3 border border-[#2a2a4a]"
            >
              💡 {currentQ.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
