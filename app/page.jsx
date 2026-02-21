"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { motion } from "framer-motion";
import { getAuthInstance } from "../lib/firebase";
import { joinRoom } from "../lib/firestoreHelpers";
import { QUESTION_SETS, DEFAULT_SET_ID } from "../constants/questionSets";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_SET_ID);
  const [mode, setMode] = useState("join"); // "join" | "create"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name first!"); return; }
    if (!roomCode.trim()) { setError("Enter a room code!"); return; }

    setLoading(true);
    setError("");
    try {
      const { user } = await signInAnonymously(getAuthInstance());
      await joinRoom(roomCode.toUpperCase(), user.uid, name.trim());
      sessionStorage.setItem("playerId", user.uid);
      sessionStorage.setItem("playerName", name.trim());
      sessionStorage.setItem("isHost", "false");
      router.push(`/game/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError(err.message || "Failed to join room. Check the code and try again.");
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name first!"); return; }

    setLoading(true);
    setError("");
    try {
      const { user } = await signInAnonymously(getAuthInstance());
      const res = await fetch("/api/generate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: user.uid, questionSetId: selectedSetId }),
      });
      const { roomId } = await res.json();
      await joinRoom(roomId, user.uid, name.trim());
      sessionStorage.setItem("playerId", user.uid);
      sessionStorage.setItem("playerName", name.trim());
      sessionStorage.setItem("isHost", "true");
      router.push(`/game/${roomId}`);
    } catch (err) {
      setError(err.message || "Failed to create room.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ff88] rounded-full blur-[120px] opacity-[0.08]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[120px] opacity-[0.08]" />
      </div>

      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4 drop-shadow-2xl">
          <span className="text-[#00ff88] drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">Skill</span>
          <span className="text-white">Arena</span>
        </h1>
        <p className="text-[#8888aa] text-lg md:text-xl max-w-lg mx-auto font-light">
          Real-time competitive quiz battles. <br/>
          <span className="text-white font-medium">Gamify Learning. Amplify Employability.</span>
        </p>
      </motion.div>

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/5 relative z-10"
      >
        {/* Mode toggle */}
        <div className="flex bg-[#0f0f1a]/50 p-1 rounded-2xl mb-8 relative">
          <button
            onClick={() => { setMode("join"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 relative z-10 ${
              mode === "join"
                ? "bg-[#00ff88] text-[#0f0f1a] shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                : "text-[#8888aa] hover:text-white"
            }`}
          >
            Join Game
          </button>
          <button
            onClick={() => { setMode("create"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 relative z-10 ${
              mode === "create"
                ? "bg-[#b44fff] text-white shadow-[0_0_20px_rgba(180,79,255,0.3)]"
                : "text-[#8888aa] hover:text-white"
            }`}
          >
            Create Room
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === "join" ? handleJoin : handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full bg-[#0f0f1a]/60 border border-[#2a2a4a] text-white p-4 rounded-xl focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] placeholder-[#444466] transition-all font-medium"
              maxLength={12}
            />
          </div>

          {mode === "join" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="6-character code"
                className="w-full bg-[#0f0f1a]/60 border border-[#2a2a4a] text-white p-4 rounded-xl focus:outline-none focus:border-[#b44fff] focus:ring-1 focus:ring-[#b44fff] placeholder-[#444466] uppercase tracking-widest font-mono text-lg transition-all"
                maxLength={6}
              />
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <label className="block text-xs font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">
                Select Topic
              </label>
              <div className="relative">
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  className="w-full appearance-none bg-[#0f0f1a]/60 border border-[#2a2a4a] text-white p-4 rounded-xl focus:outline-none focus:border-[#b44fff] focus:ring-1 focus:ring-[#b44fff] transition-all cursor-pointer font-medium"
                >
                  {Object.entries(QUESTION_SETS).map(([id, set]) => (
                    <option key={id} value={id} className="bg-[#16213e]">
                      {set.title} ({set.category})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8888aa]">
                  ▼
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-4 rounded-xl font-bold text-lg tracking-wide uppercase transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              mode === "join" 
                ? "bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#0f0f1a] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]" 
                : "bg-gradient-to-r from-[#b44fff] to-[#922ce6] text-white shadow-[0_0_20px_rgba(180,79,255,0.3)] hover:shadow-[0_0_30px_rgba(180,79,255,0.5)]"
            } ${loading ? "opacity-70 cursor-wait" : ""}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {mode === "join" ? "Joining..." : "Creating..."}
              </span>
            ) : (
              mode === "join" ? "Enter Arena" : "Launch Room"
            )}
          </button>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#ff0099] text-sm font-medium text-center bg-[#ff0099]/10 py-2 rounded-lg border border-[#ff0099]/20"
            >
              {error}
            </motion.p>
          )}
        </form>
      </motion.div>
        
      {/* Footer */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-[#444466] text-sm font-mono"
      >
        Built for TaPTaP Game Engine Hackathon 2026
      </motion.p>

      <a
        href="/admin"
        className="mt-4 text-xs text-[#44446a] hover:text-[#8888aa] transition-colors underline underline-offset-2"
      >
        Admin: Upload Question Set
      </a>
    </main>
  );
}
