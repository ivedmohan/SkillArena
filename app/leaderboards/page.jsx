"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Leaderboard from "../../components/Leaderboard";

const GAMES = [
  { id: "aptitude-blitz", title: "AptitudeBlitz", icon: "🧠", color: "#b44fff" },
  { id: "word-builder", title: "WordBuilder", icon: "📝", color: "#00ff88" },
  { id: "sudoku", title: "SudokuBlitz", icon: "🔢", color: "#ff0099" },
  { id: "memory-match", title: "VisualMatch", icon: "🃏", color: "#ffcc00" },
];

export default function LeaderboardsPage() {
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 relative overflow-hidden text-white w-full">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-[#00ff88] rounded-full blur-[160px] opacity-[0.05]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[140px] opacity-[0.04]" />
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-black mb-3 text-white tracking-tight">
            Hall of <span className="text-[#00ff88] drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">Fame</span>
          </h1>
          <p className="text-[#8888aa] text-sm max-w-lg mx-auto leading-relaxed">
            The top performers across all arenas. Select a game below to view the global rankings.
          </p>
        </motion.div>

        {/* Game Selector Tabs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-[#16213e] p-2 rounded-2xl border border-[#2a2a4a] shadow-xl"
        >
          {GAMES.map((game) => {
            const isActive = selectedGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 overflow-hidden ${
                  isActive ? "text-[#0f0f1a] shadow-md" : "text-[#8888aa] hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="leaderboard-tab-bg"
                    className="absolute inset-0"
                    style={{ backgroundColor: game.color }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-lg">{game.icon}</span>
                <span className="relative z-10 tracking-wide uppercase">{game.title}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGame}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Leaderboard gameId={selectedGame} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
