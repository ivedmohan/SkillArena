"use client";
import { motion } from "framer-motion";

/**
 * QuestionCard — renders question text + 4 option buttons.
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
        ? "border-[#b44fff] bg-[#b44fff22] text-white shadow-[0_0_25px_#b44fff44] scale-[1.02]"
        : "border-white/10 bg-white/5 text-[#f0f0f0] hover:border-[#b44fff]/50 hover:bg-[#b44fff11] hover:translate-x-1";
    }

    if (opt === correctAnswer) {
      return "border-[#00ff88] bg-[#00ff8822] text-[#00ff88] shadow-[0_0_25px_#00ff8844] scale-[1.02]";
    }
    if (opt === selectedAnswer && opt !== correctAnswer) {
      return "border-[#ff0099] bg-[#ff009922] text-[#ff0099] shadow-[0_0_25px_#ff009944] scale-[1.02]";
    }
    return "border-white/5 bg-transparent text-[#444466] opacity-40 blur-[1px]";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Question text */}
      <motion.div 
        layoutId="question-card"
        className="mb-8 p-8 rounded-3xl glass-panel relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#b44fff] to-[#00ff88]" />
        <p className="text-xl md:text-3xl font-bold leading-tight text-white drop-shadow-lg">
          {question}
        </p>
      </motion.div>

      {/* Options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            layout
            key={opt}
            disabled={disabled}
            onClick={() => onAnswer(opt)}
            whileHover={!disabled && !revealed ? { scale: 1.02 } : {}}
            whileTap={!disabled && !revealed ? { scale: 0.98 } : {}}
            className={`relative flex items-center gap-4 w-full text-left px-6 py-5 rounded-2xl border-2 font-bold transition-all duration-300 ${getOptionStyle(opt)} ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-colors ${
               revealed && opt === correctAnswer ? "bg-[#00ff88] text-[#0f0f1a]" :
               revealed && opt === selectedAnswer && opt !== correctAnswer ? "bg-[#ff0099] text-white" :
               opt === selectedAnswer ? "bg-[#b44fff] text-white" : "bg-white/10 text-white/60"
            }`}>
              {String.fromCharCode(65 + i)}
            </span>
            
            <span className="flex-1 text-base md:text-lg tracking-wide">{opt}</span>

            {revealed && opt === correctAnswer && (
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="ml-auto text-[#00ff88] text-xl"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </motion.span>
            )}
            {revealed && opt === selectedAnswer && opt !== correctAnswer && (
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="ml-auto text-[#ff0099] text-xl"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
