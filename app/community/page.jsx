"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCommunityGames } from "../../lib/firestoreHelpers";

export default function CommunityHub() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore name if they already entered it on the homepage
    setName(sessionStorage.getItem("playerName") || "");
    
    // Fetch all games
    getCommunityGames(null)
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  function handlePlay(dbId) {
    if (!name.trim()) {
      alert("Please enter your name at the top before playing!");
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    sessionStorage.setItem("playerName", name.trim());
    sessionStorage.setItem("difficulty", "medium"); // Default fallback
    router.push(`/game/${dbId}`);
  }

  // Filter logic
  const filteredGames = games.filter(g => {
    const term = search.toLowerCase();
    const title = (g.meta?.title || "").toLowerCase();
    const author = (g.meta?.author || "").toLowerCase();
    const type = (g.meta?.gameType || "").toLowerCase();
    return title.includes(term) || author.includes(term) || type.includes(term);
  });

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-12 flex flex-col items-center overflow-x-hidden relative">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-[#b44fff] rounded-full blur-[140px] opacity-[0.06]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-[#00ff88] rounded-full blur-[140px] opacity-[0.06]" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
            <span className="text-[#00ff88]">Community</span> Arcade
          </h1>
          <p className="text-[#8888aa] text-sm md:text-base font-medium max-w-lg mx-auto">
            Browse and play thousands of AI-generated and Creator-uploaded games powered by the SkillArena Engine.
          </p>
        </motion.div>

        {/* Controls Bar (Name + Search) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 bg-[#ffffff05] p-5 rounded-2xl border border-[#2a2a4a]"
        >
          <div>
            <label className="block text-[10px] font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">Your Player Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter nickname to play..."
              maxLength={16}
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8888aa] uppercase tracking-wider mb-2 ml-1">Search Database</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, author, or type..."
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] text-white p-3 rounded-xl focus:outline-none focus:border-[#b44fff] transition-colors"
            />
          </div>
        </motion.div>

        {/* Grid List */}
        {loading ? (
          <div className="py-20 flex bg-[#0f0f1a] flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#2a2a4a] border-t-[#00ff88] rounded-full animate-spin" />
            <span className="text-[#8888aa] font-mono text-xs animate-pulse">Fetching global games...</span>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredGames.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center text-[#444466] font-medium"
                >
                  No games match your search.
                </motion.div>
              ) : (
                filteredGames.map((game, i) => (
                  <motion.div
                    key={game.dbId}
                    layout // Animate sorting
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col bg-[#ffffff03] border border-[#2a2a4a] rounded-2xl p-5 hover:border-[#b44fff] hover:bg-[#b44fff]/5 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[10px] uppercase font-bold text-[#b44fff] bg-[#b44fff]/10 px-2 py-1 rounded-md tracking-wider">
                        {game.meta?.gameType || "Unknown"}
                      </div>
                      {game.meta?.aiGenerated && (
                        <div className="text-[10px] uppercase font-bold text-[#00ff88] border border-[#00ff88]/30 px-2 py-1 rounded-md tracking-wider flex items-center gap-1">
                          <span>✨</span> AI
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1 group-hover:text-[#00ff88] transition-colors">
                      {game.meta?.title || "Custom Game"}
                    </h3>
                    <p className="text-[#8888aa] text-xs font-mono mb-4">
                      by <span className="text-white">{game.meta?.author || "Anonymous"}</span>
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-[#2a2a4a]/50 flex justify-between items-center">
                      <div className="flex gap-2">
                        <span className="text-[10px] text-[#444466] bg-[#0f0f1a] px-2 py-1 rounded-md">
                          ⏳ {game.meta?.timeLimit || "--"}s
                        </span>
                      </div>
                      <button
                        onClick={() => handlePlay(game.dbId)}
                        className="px-4 py-2 bg-[#00ff88] text-[#0f0f1a] font-black text-xs uppercase tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all hover:scale-105 active:scale-95"
                      >
                        Play
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12 text-center pb-8">
          <button onClick={() => router.push("/")} className="text-sm font-bold text-[#444466] hover:text-white transition-colors flex items-center gap-2 mx-auto">
            <span>←</span> Back to Main Library
          </button>
        </div>
      </div>
    </main>
  );
}
