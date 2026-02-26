"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateWord, calcWordPoints } from "./wordLogic";

/**
 * WordBuilderGame — Word formation plugin.
 *
 * Players tap letter tiles to build words, then submit.
 * Valid words score points. Invalid attempts flash an error (no life loss).
 * When the main engine timer expires the game ends via the shell.
 */
export default function WordBuilderGame({ config, onCorrect, onWrong, onComplete, isActive }) {
  const rounds = config.config.rounds;
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]); // tile indices chosen
  const [foundWords, setFoundWords] = useState([]);
  const [flash, setFlash] = useState(null); // { msg, ok }

  const round = rounds[roundIndex];
  const currentWord = selectedIndices.map(i => round.letters[i]).join("");

  // When isActive turns false (timer expired from shell) → complete
  useEffect(() => {
    if (!isActive) onComplete();
  }, [isActive]); // eslint-disable-line

  function tapLetter(idx) {
    if (!isActive || selectedIndices.includes(idx)) return;
    setSelectedIndices(prev => [...prev, idx]);
  }

  function clearWord() {
    setSelectedIndices([]);
  }

  function submitWord() {
    if (!isActive || currentWord.length === 0) return;

    const { valid, reason } = validateWord(currentWord, round, foundWords);
    if (!valid) {
      setFlash({ msg: reason, ok: false });
      setTimeout(() => setFlash(null), 1200);
      setSelectedIndices([]);
      return;
    }

    const pts = calcWordPoints(currentWord, round);
    const isBonusWord = (round.bonusWords ?? []).map(b => b.toUpperCase()).includes(currentWord.toUpperCase());

    setFoundWords(prev => [...prev, currentWord.toUpperCase()]);
    setFlash({ msg: isBonusWord ? `BONUS! +${pts}` : `+${pts}`, ok: true });
    setTimeout(() => setFlash(null), 900);
    setSelectedIndices([]);
    onCorrect(pts);
  }

  function handleBackspace() {
    setSelectedIndices(prev => prev.slice(0, -1));
  }

  // Keyboard support
  useEffect(() => {
    if (!isActive) return;
    function onKey(e) {
      if (e.key === "Enter") submitWord();
      if (e.key === "Backspace") handleBackspace();
      if (e.key === "Escape") clearWord();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, currentWord, foundWords]); // eslint-disable-line

  return (
    <div className="flex flex-col h-full p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Round indicator */}
      <div className="flex items-center justify-between text-xs text-[#8888aa] font-mono">
        <span className="uppercase tracking-widest">Round {roundIndex + 1} / {rounds.length}</span>
        <span>{foundWords.length} word{foundWords.length !== 1 ? "s" : ""} found</span>
      </div>

      {/* Current word display */}
      <div className="relative h-16 flex items-center justify-center rounded-2xl border-2 border-[#2a2a4a] bg-[#ffffff05]">
        <AnimatePresence>
          {flash && (
            <motion.span
              key={flash.msg}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute font-black text-lg ${flash.ok ? "text-[#00ff88]" : "text-[#ff0099]"}`}
            >
              {flash.msg}
            </motion.span>
          )}
        </AnimatePresence>
        {!flash && (
          <span className={`font-black text-2xl tracking-widest ${currentWord ? "text-white" : "text-[#333355]"}`}>
            {currentWord || "TAP TILES"}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleBackspace}
          disabled={!isActive || selectedIndices.length === 0}
          className="flex-1 py-2.5 rounded-xl border border-[#2a2a4a] text-[#8888aa] text-sm font-bold hover:border-[#ff0099] hover:text-[#ff0099] transition-colors disabled:opacity-30"
        >
          ← Back
        </button>
        <button
          onClick={clearWord}
          disabled={!isActive || selectedIndices.length === 0}
          className="flex-1 py-2.5 rounded-xl border border-[#2a2a4a] text-[#8888aa] text-sm font-bold hover:border-[#ff0099] hover:text-[#ff0099] transition-colors disabled:opacity-30"
        >
          Clear
        </button>
        <button
          onClick={submitWord}
          disabled={!isActive || currentWord.length < (round.minWordLength ?? 3)}
          className="flex-[2] py-2.5 rounded-xl bg-[#00ff88] text-[#0f0f1a] font-black text-sm hover:shadow-[0_0_20px_#00ff8855] transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Submit ↵
        </button>
      </div>

      {/* Letter tiles */}
      <div className="flex flex-wrap gap-2 justify-center py-2">
        {round.letters.map((letter, idx) => {
          const isUsed = selectedIndices.includes(idx);
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => tapLetter(idx)}
              disabled={!isActive || isUsed}
              className={`w-11 h-11 rounded-xl font-black text-lg border-2 transition-all select-none ${
                isUsed
                  ? "border-[#b44fff] bg-[#b44fff22] text-[#b44fff] opacity-50"
                  : "border-[#2a2a4a] bg-[#ffffff08] text-white hover:border-[#b44fff] hover:bg-[#b44fff15] active:scale-95"
              }`}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>

      {/* Found words */}
      {foundWords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {foundWords.map((w, i) => {
            const isBonus = (round.bonusWords ?? []).map(b => b.toUpperCase()).includes(w);
            return (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isBonus
                    ? "border-[#ffcc00] text-[#ffcc00] bg-[#ffcc0015]"
                    : "border-[#00ff8840] text-[#00ff88] bg-[#00ff8810]"
                }`}
              >
                {w} {isBonus && "⭐"}
              </span>
            );
          })}
        </div>
      )}

      {/* Bonus words hint */}
      <div className="text-center text-xs text-[#444466]">
        Bonus words: {round.bonusWords.join(", ")}
      </div>
    </div>
  );
}
