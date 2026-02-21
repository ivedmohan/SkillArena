"use client";
import { motion } from "framer-motion";

/**
 * QuestionCard — renders question text + 4 option buttons.
 *
 * Props:
 *   question       {string}   — question text
 *   options        {string[]} — exactly 4 options
 *   onAnswer       {fn}       — called with selected option string
 *   disabled       {boolean}  — lock all buttons after answer
 *   selectedAnswer {string}   — the option the player chose
 *   correctAnswer  {string}   — shown during ANSWER_REVEAL phase
 *   revealed       {boolean}  — whether to show correct/wrong colours
 */
export default function QuestionCard({
  question,
  options,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
  revealed,
}) {
  function getOptionStyle(opt) {
    if (!revealed) {
      const isSelected = opt === selectedAnswer;
      return isSelected
        ? "border-[#b44fff] bg-[#b44fff22] text-white shadow-[0_0_10px_#b44fff55]"
        : "border-[#2a2a4a] bg-[#1a1a2e] text-[#f0f0f0] hover:border-[#b44fff] hover:bg-[#b44fff11]";
    }

    if (opt === correctAnswer) {
      return "border-[#00ff88] bg-[#00ff8822] text-[#00ff88] shadow-[0_0_12px_#00ff8866]";
    }
    if (opt === selectedAnswer && opt !== correctAnswer) {
      return "border-[#ff0099] bg-[#ff009922] text-[#ff0099] shadow-[0_0_12px_#ff009966]";
    }
    return "border-[#2a2a4a] bg-[#1a1a2e] text-[#444466] opacity-50";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {/* Question text */}
      <div className="mb-6 p-5 rounded-2xl bg-[#16213e] border border-[#2a2a4a]">
        <p className="text-lg md:text-xl font-semibold leading-relaxed text-[#f0f0f0]">
          {question}
        </p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => onAnswer(opt)}
            className={`relative flex items-center gap-3 w-full text-left px-4 py-4 rounded-xl border-2 font-medium transition-all duration-200 ${getOptionStyle(opt)} ${
              disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0f0f1a] border border-current flex items-center justify-center text-sm font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1 text-sm md:text-base">{opt}</span>

            {revealed && opt === correctAnswer && (
              <span className="ml-auto text-[#00ff88] font-bold">✓</span>
            )}
            {revealed && opt === selectedAnswer && opt !== correctAnswer && (
              <span className="ml-auto text-[#ff0099] font-bold">✗</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
