"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-3">
          <span className="text-[#00ff88]">Skill</span>
          <span className="text-white">Arena</span>
        </h1>
        <p className="text-[#8888aa] text-lg md:text-xl max-w-md mx-auto">
          Competitive quiz battles. Earn combos. Climb the leaderboard.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[#2a2a4a] mb-6">
          <button
            onClick={() => { setMode("join"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === "join"
                ? "bg-[#00ff88] text-[#0f0f1a]"
                : "bg-transparent text-[#8888aa] hover:text-white"
            }`}
          >
            Join Game
          </button>
          <button
            onClick={() => { setMode("create"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === "create"
                ? "bg-[#b44fff] text-white"
                : "bg-transparent text-[#8888aa] hover:text-white"
            }`}
          >
            Create Room
          </button>
        </div>

        <form onSubmit={mode === "join" ? handleJoin : handleCreate} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#8888aa] mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Vedmohan"
              className="w-full px-4 py-3 rounded-xl bg-[#0f0f1a] border border-[#2a2a4a] text-white placeholder-[#44446a] focus:outline-none focus:border-[#b44fff] transition-colors"
            />
          </div>

          {/* Join: room code input */}
          {mode === "join" && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8888aa] mb-1.5">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="e.g. ABC123"
                className="w-full px-4 py-3 rounded-xl bg-[#0f0f1a] border border-[#2a2a4a] text-white placeholder-[#44446a] focus:outline-none focus:border-[#00ff88] transition-colors font-mono tracking-widest text-xl"
              />
            </div>
          )}

          {/* Create: question set picker */}
          {mode === "create" && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8888aa] mb-2">
                Question Set
              </label>
              <div className="flex flex-col gap-2">
                {Object.entries(QUESTION_SETS).map(([id, set]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSetId(id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedSetId === id
                        ? "border-[#b44fff] bg-[#b44fff11]"
                        : "border-[#2a2a4a] bg-[#0f0f1a] hover:border-[#444466]"
                    }`}
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">{set.label}</p>
                      <p className="text-[#8888aa] text-xs">
                        {set.category} · {set.difficulty} · {set.questionCount} questions
                      </p>
                    </div>
                    {selectedSetId === id && (
                      <span className="text-[#b44fff] font-bold text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-[#ff0099] text-sm bg-[#ff009911] border border-[#ff009933] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-black text-base transition-all active:scale-95 ${
              loading
                ? "opacity-50 cursor-not-allowed bg-[#2a2a4a] text-[#8888aa]"
                : mode === "join"
                ? "bg-[#00ff88] text-[#0f0f1a] hover:shadow-[0_0_20px_#00ff8888]"
                : "bg-[#b44fff] text-white hover:shadow-[0_0_20px_#b44fff88]"
            }`}
          >
            {loading ? "Entering arena…" : mode === "join" ? "Join Game →" : "Create Room →"}
          </button>
        </form>
      </div>

      <a
        href="/admin"
        className="mt-8 text-xs text-[#44446a] hover:text-[#8888aa] transition-colors underline underline-offset-2"
      >
        Admin: Upload Question Set
      </a>
    </main>
  );
}
