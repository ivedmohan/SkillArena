"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "../hooks/useLeaderboard";

const RANK_ICONS = ["👑", "🥈", "🥉"];

export default function Leaderboard({ roomId, currentPlayerId }) {
  // Use the hook to get real-time players
  const { players = [], loading } = useLeaderboard(roomId);

  // Fallback or loading state
  if (loading && players.length === 0) {
    return (
      <div className="p-6 text-center text-[#8888aa] text-sm animate-pulse glass-panel rounded-2xl">
        Summoning leaderboard...
      </div>
    );
  }

  // Sort happens in the hook usually, but ensure consistency here if needed
  // (Assuming hook returns sorted players)

  return (
    <div className="w-full glass-panel rounded-3xl p-6 overflow-hidden relative">
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b44fff] via-[#00ff88] to-[#b44fff] opacity-50" />
      
      <h3 className="text-xs font-black uppercase tracking-widest text-[#8888aa] mb-6 flex items-center gap-2">
        <span className="text-lg">🏆</span> Live Rankings
      </h3>

      <ul className="flex flex-col gap-3 relative z-10">
        <AnimatePresence mode="popLayout">
          {players.map((player, i) => {
            const isSelf = player.id === currentPlayerId;
            const isTop3 = i < 3;
            
            return (
              <motion.li
                layout
                key={player.id}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                  isSelf
                    ? "border-[#b44fff] bg-[#b44fff22] shadow-[0_0_15px_rgba(180,79,255,0.2)]"
                    : "border-white/5 bg-white/5"
                } ${isTop3 ? "border-t-white/20" : ""}`}
              >
                {/* Rank */}
                <span className={`w-8 h-8 flex items-center justify-center font-black text-lg ${
                  i === 0 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] scale-125" :
                  i === 1 ? "text-slate-300" :
                  i === 2 ? "text-amber-700" :
                  "text-[#8888aa] text-sm"
                }`}>
                  {RANK_ICONS[i] ?? (i + 1)}
                </span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm md:text-base ${isSelf ? "text-white" : "text-[#d0d0e0]"}`}>
                    {player.name}
                    {isSelf && <span className="ml-2 text-[10px] uppercase bg-[#b44fff] text-white px-1.5 py-0.5 rounded shadow-sm">You</span>}
                  </p>
                </div>

                {/* Lives */}
                <div className="hidden sm:flex items-center gap-0.5 text-xs">
                   {Array.from({ length: 3 }).map((_, li) => (
                      <span key={li} className={li < (player.lives ?? 0) ? "opacity-100 grayscale-0" : "opacity-20 grayscale"}>
                        ❤️
                      </span>
                   ))}
                </div>

                {/* Score */}
                <div className="text-right min-w-[60px]">
                  <span className="block font-black text-[#00ff88] text-lg tabular-nums leading-none drop-shadow-sm">
                    {player.score ?? 0}
                  </span>
                  <span className="text-[10px] uppercase text-[#8888aa] font-semibold tracking-wider">
                    PTS
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>

        {players.length === 0 && !loading && (
          <li className="text-center text-[#8888aa] text-sm py-8 italic border border-dashed border-[#2a2a4a] rounded-xl">
            Waiting for players to join...
          </li>
        )}
      </ul>
    </div>
  );
}
