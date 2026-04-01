"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createShuffledDeck, calcPoints } from "./memoryLogic";

/**
 * MemoryMatchGame — Visual pair matching plugin.
 *
 * Players tap cards to reveal emojis. Matching pairs stay flipped and score points.
 * Mismatching pairs flip back and cause life loss (engine side).
 */
export default function MemoryMatchGame({ config, onCorrect, onWrong, onComplete, isActive }) {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [flash, setFlash] = useState(null); // { msg, ok }

  const totalPairs = config.config.pairs?.length || 0;
  const isProcessing = useRef(false);

  // Initialize board
  useEffect(() => {
    if (!config.config.pairs) return;
    const shuffled = createShuffledDeck(config.config.pairs);
    setCards(shuffled);
  }, [config]);

  // When isActive turns false (timer expired from shell) -> force complete
  useEffect(() => {
    if (!isActive) onComplete();
  }, [isActive]); // eslint-disable-line

  function handleCardClick(index) {
    if (!isActive || isProcessing.current) return;
    if (cards[index].isMatched || flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If two cards flipped, check match
    if (newFlipped.length === 2) {
      isProcessing.current = true;
      const [firstIdx, secondIdx] = newFlipped;
      const isMatch = cards[firstIdx].emoji === cards[secondIdx].emoji;

      if (isMatch) {
        // Success
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => 
            (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c
          ));
          setFlippedIndices([]);
          setMatchedPairs(prev => prev + 1);
          setFlash({ msg: "+SUCCESS", ok: true });
          setTimeout(() => setFlash(null), 600);
          isProcessing.current = false;
          
          onCorrect(calcPoints()); // Base points, engine adds combo multiplier

          // Check Win Condition
          if (matchedPairs + 1 === totalPairs) {
            setTimeout(onComplete, 1000);
          }
        }, 600);
      } else {
        // Mismatch
        setTimeout(() => {
          setFlippedIndices([]);
          setFlash({ msg: "MISMATCH", ok: false });
          setTimeout(() => setFlash(null), 600);
          isProcessing.current = false;
          onWrong();
        }, 800);
      }
    }
  }

  // Determine grid layout based on number of cards
  const gridCols = cards.length > 12 ? "grid-cols-4" : cards.length > 8 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="flex flex-col h-full p-4 gap-4 max-w-lg mx-auto w-full items-center justify-center">
      {/* HUD Header */}
      <div className="w-full flex justify-between items-center px-2 mb-2 font-mono text-xs text-[#8888aa] uppercase tracking-widest border-b border-[#2a2a4a]/50 pb-2">
        <span>Matches: {matchedPairs}/{totalPairs}</span>
        <div className="relative h-4 w-24 flex justify-end">
          <AnimatePresence>
            {flash && (
              <motion.span
                key={flash.msg}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute right-0 top-0 font-black ${flash.ok ? "text-[#00ff88]" : "text-[#ff0099]"}`}
              >
                {flash.msg}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card Grid */}
      <div className={`grid gap-3 w-full max-w-sm ${gridCols} perspective-[1000px]`}>
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || card.isMatched;

          return (
            <div
              key={card.id}
              className="relative w-full aspect-square cursor-pointer preserve-3d group"
              onClick={() => handleCardClick(index)}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full relative preserve-3d"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Back of Card (Hidden Face) */}
                <div
                  className={`absolute inset-0 backface-hidden rounded-xl border-2 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-colors
                    ${!isActive ? "opacity-50 border-[#2a2a4a] bg-[#1a1a2e]" : "border-[#444466] bg-[#2a2a4a] group-hover:border-[#00ff88]"}`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-2xl opacity-20 text-[#8888aa]">?</span>
                </div>

                {/* Front of Card (Revealed Face) */}
                <div
                  className={`absolute inset-0 backface-hidden rounded-xl border-2 flex items-center justify-center text-4xl sm:text-5xl shadow-lg
                    ${card.isMatched ? "border-[#00ff88] bg-[#00ff88]/10" : "border-[#b44fff] bg-[#b44fff]/10"}`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <motion.span
                    initial={false}
                    animate={card.isMatched ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {card.emoji}
                  </motion.span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
