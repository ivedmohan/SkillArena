"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import AnalyticsChart from "../../components/AnalyticsChart";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  let results = null;
  try {
    const raw = searchParams.get("data");
    if (raw) results = JSON.parse(decodeURIComponent(raw));
  } catch {
    results = null;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8888aa] mb-4">No results data found.</p>
          <button onClick={() => router.push("/")} className="text-[#00ff88] underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { score, correct, total, accuracy, weakTopics, livesRemaining } = results;

  const grade =
    accuracy >= 90 ? { label: "S Rank", color: "#00ff88", emoji: "🏆" }
    : accuracy >= 75 ? { label: "A Rank", color: "#00ff88", emoji: "🌟" }
    : accuracy >= 60 ? { label: "B Rank", color: "#b44fff", emoji: "👍" }
    : accuracy >= 40 ? { label: "C Rank", color: "#ffcc00", emoji: "📚" }
    : { label: "D Rank", color: "#ff0099", emoji: "💪" };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Rank badge */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            className="text-7xl mb-3"
          >
            {grade.emoji}
          </motion.div>
          <h1 className="text-4xl font-black" style={{ color: grade.color }}>
            {grade.label}
          </h1>
          <p className="text-[#8888aa] mt-1">Game Over</p>
        </div>

        {/* Stats card */}
        <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox label="Score" value={score} color="#00ff88" />
            <StatBox label="Accuracy" value={`${accuracy}%`} color="#b44fff" />
            <StatBox label="Correct" value={`${correct}/${total}`} color="#00ff88" />
            <StatBox
              label="Lives Left"
              value={"❤️".repeat(Math.max(0, livesRemaining)) || "0"}
              color="#ff0099"
            />
          </div>

          {/* Weak areas chart */}
          <AnalyticsChart weakTopics={weakTopics} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3.5 rounded-xl border border-[#2a2a4a] text-[#8888aa] hover:border-[#b44fff] hover:text-white transition-colors font-semibold"
          >
            Home
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("playerId");
              sessionStorage.removeItem("playerName");
              router.push("/");
            }}
            className="flex-1 py-3.5 rounded-xl bg-[#00ff88] text-[#0f0f1a] font-black hover:shadow-[0_0_20px_#00ff8888] transition-shadow"
          >
            Play Again →
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#0f0f1a] border border-[#2a2a4a]">
      <span className="text-xs uppercase tracking-widest text-[#8888aa] mb-1">{label}</span>
      <span className="text-2xl font-black tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#8888aa]">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
