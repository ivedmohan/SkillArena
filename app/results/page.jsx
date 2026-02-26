"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Leaderboard from "../../components/Leaderboard";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    setPlayerName(sessionStorage.getItem("playerName") ?? "");
  }, []);

  let results = null;
  try {
    const raw = searchParams.get("data");
    if (raw) results = JSON.parse(decodeURIComponent(raw));
  } catch {
    results = null;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <div className="text-center">
          <p className="text-[#8888aa] mb-4">No results data found.</p>
          <button onClick={() => router.push("/")} className="text-[#00ff88] underline">← Home</button>
        </div>
      </div>
    );
  }

  const { score, timeTaken, lives, gameId, gameTitle, gameOver } = results;

  const grade =
    score >= 200 ? { label: "S Rank", color: "#00ff88", emoji: "🏆" }
    : score >= 150 ? { label: "A Rank", color: "#00ff88", emoji: "🌟" }
    : score >= 80  ? { label: "B Rank", color: "#b44fff", emoji: "👍" }
    : score >= 40  ? { label: "C Rank", color: "#ffcc00", emoji: "📚" }
    : { label: "D Rank", color: "#ff0099", emoji: "💪" };

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center justify-start px-4 py-12">
      {/* Bg blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ff88] rounded-full blur-[140px] opacity-[0.05]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[140px] opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Rank badge */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            className="text-7xl mb-3"
          >
            {gameOver ? "💀" : grade.emoji}
          </motion.div>
          <h1 className="text-4xl font-black" style={{ color: gameOver ? "#ff0099" : grade.color }}>
            {gameOver ? "Game Over" : grade.label}
          </h1>
          <p className="text-[#8888aa] mt-1 text-sm">{gameTitle}</p>
        </div>

        {/* Stats */}
        <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Score" value={score} color="#00ff88" />
            <StatBox label="Time" value={`${timeTaken}s`} color="#b44fff" />
            <StatBox label="Lives Left" value={"❤️".repeat(Math.max(0, lives ?? 0)) || "0"} color="#ff0099" />
            <StatBox label="Status" value={gameOver ? "Dead" : "Cleared!"} color={gameOver ? "#ff0099" : "#00ff88"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3.5 rounded-xl border border-[#2a2a4a] text-[#8888aa] hover:border-[#b44fff] hover:text-white transition-colors font-semibold"
          >
            Home
          </button>
          <button
            onClick={() => {
              router.push(`/game/${gameId}`);
            }}
            className="flex-1 py-3.5 rounded-xl bg-[#00ff88] text-[#0f0f1a] font-black hover:shadow-[0_0_20px_#00ff8888] transition-shadow"
          >
            Play Again →
          </button>
        </div>

        {/* Leaderboard */}
        {gameId && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#8888aa] mb-3">
              Top Scores — {gameTitle}
            </h2>
            <Leaderboard gameId={gameId} currentPlayerName={playerName} />
          </div>
        )}
      </motion.div>
    </main>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#0f0f1a] border border-[#2a2a4a]">
      <span className="text-xs uppercase tracking-widest text-[#8888aa] mb-1">{label}</span>
      <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-[#8888aa]">
        Loading results...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
