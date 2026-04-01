"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCommunityGames } from "../lib/firestoreHelpers";

const GAMES = [
  {
    id: "aptitude-blitz",
    title: "AptitudeBlitz",
    description: "10 MCQ questions. Time pressure. Combo multipliers.",
    icon: "🧠",
    color: "#b44fff",
    glow: "rgba(180,79,255,0.3)",
    tags: ["MCQ", "15s / Q", "3 lives"],
    skills: ["problem-solving", "numerical-aptitude", "speed"],
    learningOutcome: "Strengthen quantitative aptitude for campus placements",
  },
  {
    id: "word-builder",
    title: "WordBuilder",
    description: "Form words from letter tiles before time runs out.",
    icon: "📝",
    color: "#00ff88",
    glow: "rgba(0,255,136,0.3)",
    tags: ["Word", "90s", "3 lives"],
    skills: ["vocabulary", "pattern-recognition", "speed"],
    learningOutcome: "Build English vocabulary and word formation skills",
  },
  {
    id: "sudoku",
    title: "SudokuBlitz",
    description: "Fill the 9×9 grid. Every cell earns points.",
    icon: "🔢",
    color: "#ff0099",
    glow: "rgba(255,0,153,0.3)",
    tags: ["Grid", "5 min", "3 lives"],
    skills: ["logic", "attention-to-detail", "algorithms"],
    learningOutcome: "Develop logical reasoning and systematic problem solving",
  },
  {
    id: "memory-match",
    title: "MemoryMatch",
    description: "Flip cards and find the hidden pairs before time runs out.",
    icon: "🃏",
    color: "#ffcc00",
    glow: "rgba(255,204,0,0.3)",
    tags: ["Visual", "60s", "3 lives"],
    skills: ["spatial-memory", "pattern-recognition", "focus"],
    learningOutcome: "Strengthen visual short-term memory through spatial challenges",
  },
];

const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   color: "#00ff88" },
  { id: "medium", label: "Medium", color: "#ffcc00" },
  { id: "hard",   label: "Hard",   color: "#ff0099" },
];

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [error, setError] = useState("");
  const [communityGames, setCommunityGames] = useState([]);

  useEffect(() => {
    getCommunityGames(6).then(setCommunityGames).catch(console.error);
  }, []);

  function handlePlay() {
    if (!name.trim()) { setError("Enter your name first!"); return; }
    if (!selected) { setError("Pick a game!"); return; }
    sessionStorage.setItem("playerName", name.trim());
    sessionStorage.setItem("difficulty", difficulty);
    router.push(`/game/${selected}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ff88] rounded-full blur-[140px] opacity-[0.06]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[140px] opacity-[0.06]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#ff0099] rounded-full blur-[180px] opacity-[0.03]" />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-3">
          <span className="text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.4)]">Skill</span>
          <span className="text-white">Arena</span>
        </h1>
        <p className="text-[#8888aa] text-base md:text-lg font-light">
          Plugin-based game engine.{" "}
          <span className="text-white font-medium">Gamify Learning. Amplify Employability.</span>
        </p>
      </motion.div>

      {/* Name input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm mb-8"
      >
        <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Enter your nickname..."
          maxLength={16}
          className="w-full bg-[#0f0f1a]/60 border border-[#2a2a4a] text-white p-4 rounded-xl focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] placeholder-[#444466] transition-all font-medium"
        />
      </motion.div>

      {/* Game cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
        {GAMES.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSelected(game.id); setError(""); }}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              selected === game.id
                ? "border-current shadow-lg"
                : "border-[#2a2a4a] bg-[#ffffff04] hover:border-[#444466]"
            }`}
            style={
              selected === game.id
                ? { borderColor: game.color, background: `${game.color}10`, boxShadow: `0 0 30px ${game.glow}` }
                : {}
            }
          >
            {selected === game.id && (
              <span className="absolute top-3 right-3 text-xs font-black px-2 py-0.5 rounded-full" style={{ color: game.color, background: `${game.color}20` }}>
                Selected
              </span>
            )}
            <div className="text-4xl mb-3">{game.icon}</div>
            <h2 className="font-black text-white text-lg mb-1">{game.title}</h2>
            <p className="text-[#8888aa] text-sm mb-3 leading-snug">{game.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {game.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffffff08] text-[#8888aa] font-semibold uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
            {/* Skill tags */}
            {game.skills && (
              <div className="flex flex-wrap gap-1 mt-2">
                {game.skills.map(skill => (
                  <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: game.color, background: `${game.color}12`, border: `1px solid ${game.color}25` }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {/* Learning outcome */}
            {game.learningOutcome && (
              <p className="text-[10px] text-[#666688] mt-2 leading-snug italic">
                🎯 {game.learningOutcome}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      {/* Community AI Games */}
      <AnimatePresence>
        {communityGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full max-w-3xl mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Community AI Games</h3>
              <div className="flex-1 h-px bg-[#2a2a4a]/50" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communityGames.map((game, i) => (
                <motion.button
                  key={game.dbId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelected(game.dbId); setError(""); }}
                  className={`relative text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                    selected === game.dbId
                      ? "border-[#ffcc00] bg-[#ffcc00]/10 shadow-[0_0_20px_rgba(255,204,0,0.2)]"
                      : "border-[#2a2a4a] bg-[#ffffff02] hover:border-[#444466] hover:bg-[#ffffff05]"
                  }`}
                >
                  {selected === game.dbId && (
                    <span className="absolute -top-2 -right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-[#ffcc00] text-[#0f0f1a]">
                      SELECTED
                    </span>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                      {game.meta?.title || "Custom Game"}
                    </h4>
                    <p className="text-[10px] text-[#8888aa] mt-0.5 font-mono">
                      by <span className="text-[#00ff88]">{game.meta?.author || "Anonymous"}</span>
                    </p>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-[#b44fff] bg-[#b44fff]/10 px-2 py-1 rounded-full">
                    {game.meta?.gameType}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => router.push("/community")}
                className="text-xs font-bold text-[#b44fff] border border-[#b44fff]/50 px-6 py-2.5 rounded-full hover:bg-[#b44fff]/10 hover:shadow-[0_0_15px_rgba(180,79,255,0.2)] transition-all flex items-center gap-2"
              >
                Browse All Community Games <span>→</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col items-center gap-3 mb-6"
      >
        <span className="text-xs font-bold text-[#8888aa] uppercase tracking-widest">Difficulty</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                difficulty === d.id
                  ? "text-[#0f0f1a]"
                  : "border-[#2a2a4a] text-[#8888aa] hover:text-white"
              }`}
              style={
                difficulty === d.id
                  ? { borderColor: d.color, background: d.color, boxShadow: `0 0 16px ${d.color}55` }
                  : {}
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Play button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handlePlay}
        className="px-12 py-4 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#0f0f1a] font-black text-lg tracking-wide uppercase transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] active:scale-[0.98]"
      >
        Play Now →
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-[#ff0099] text-sm font-medium text-center bg-[#ff0099]/10 py-2 px-4 rounded-lg border border-[#ff0099]/20"
        >
          {error}
        </motion.p>
      )}

      {/* Footer */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <p className="text-[#444466] text-xs font-mono">
          Built for TaPTaP Game Engine Hackathon 2026
        </p>
        <a href="/admin" className="text-xs text-[#44446a] hover:text-[#8888aa] transition-colors underline underline-offset-2">
          Admin: Upload Game Config
        </a>
      </div>
    </main>
  );
}
