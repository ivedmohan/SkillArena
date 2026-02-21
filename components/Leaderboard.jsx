"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "../hooks/useLeaderboard";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Leaderboard — real-time score list.
 * Uses useLeaderboard hook (Firestore onSnapshot).
 */
export default function Leaderboard({ roomId, currentPlayerId }) {
  const { players, loading } = useLeaderboard(roomId);

  if (loading) {
    return (
      <div className="text-center text-[#8888aa] py-4 text-sm animate-pulse">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xs uppercase tracking-widest text-[#8888aa] mb-3 font-semibold">
        Leaderboard
      </h3>
      <ul className="flex flex-col gap-2">
        <AnimatePresence>
          {players.map((player, i) => {
            const isSelf = player.id === currentPlayerId;
            return (
              <motion.li
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isSelf
                    ? "border-[#b44fff] bg-[#b44fff11] shadow-[0_0_8px_#b44fff44]"
                    : "border-[#2a2a4a] bg-[#1a1a2e]"
                }`}
              >
                <span className="text-lg w-8 text-center flex-shrink-0">
                  {RANK_MEDALS[i] ?? `#${i + 1}`}
                </span>
                <span className="flex-1 font-semibold text-sm truncate text-[#f0f0f0]">
                  {player.name}
                  {isSelf && <span className="ml-1 text-[#b44fff] text-xs">(you)</span>}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[#8888aa] text-xs">
                    {"❤️".repeat(Math.max(0, player.lives ?? 0))}
                  </span>
                  <span className="font-black text-[#00ff88] tabular-nums">
                    {player.score ?? 0}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>

        {players.length === 0 && (
          <li className="text-center text-[#8888aa] text-sm py-2">
            No players yet…
          </li>
        )}
      </ul>
    </div>
  );
}
