"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useEngineCore } from "../../../hooks/useEngineCore";
import { ENGINE_STATE } from "../../../engine/EngineCore";
import { GAME_CONFIG } from "../../../constants/gameConfig";
import GameShell from "../../../components/GameShell";
import Leaderboard from "../../../components/Leaderboard";

/**
 * Engine Shell Page — /game/[gameId]
 *
 * Loads the game config from /games/{gameId}.json,
 * initialises the engine, then renders the plugin inside GameShell.
 */
export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [gameConfig, setGameConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Load player name + difficulty from session
  useEffect(() => {
    const name = sessionStorage.getItem("playerName") ?? "Player";
    setPlayerName(name);
  }, []);

  // Fetch game config from public/games/{gameId}.json, apply difficulty override
  useEffect(() => {
    if (!gameId) return;
    fetch(`/games/${gameId}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`Config not found for "${gameId}"`);
        return r.json();
      })
      .then(cfg => {
        const diff = sessionStorage.getItem("difficulty") ?? "easy";
        // For sudoku: set timeLimit from the matching puzzle's timeLimit
        if (cfg.meta.gameType === "grid") {
          const puzzle = cfg.config.puzzles?.find(p => p.difficulty === diff) ?? cfg.config.puzzles?.[0];
          cfg = { ...cfg, meta: { ...cfg.meta, difficulty: diff, timeLimit: puzzle?.timeLimit ?? cfg.meta.timeLimit } };
        } else {
          cfg = { ...cfg, meta: { ...cfg.meta, difficulty: diff } };
        }
        setGameConfig(cfg);
      })
      .catch(e => setConfigError(e.message));
  }, [gameId]);

  const { engine, Plugin, countdown, onCorrect, onWrong, onComplete, onTimerExpire, adaptive } =
    useEngineCore(playerName || null, gameConfig);

  const session = engine?.session;
  const gameState = engine?.gameState;

  // Navigate to results when game ends
  useEffect(() => {
    if (!session) return;
    if (gameState === ENGINE_STATE.RESULTS || gameState === ENGINE_STATE.GAME_OVER) {
      const data = encodeURIComponent(JSON.stringify({
        score: session.score,
        timeTaken: session.timeTaken,
        lives: session.lives,
        gameId: session.gameId,
        gameTitle: engine?.config?.meta?.title ?? gameId,
        gameOver: gameState === ENGINE_STATE.GAME_OVER,
      }));
      const t = setTimeout(() => router.push(`/results?data=${data}`), 1200);
      return () => clearTimeout(t);
    }
  }, [gameState]); // eslint-disable-line

  const timeLimit = gameConfig?.meta?.timeLimit ?? GAME_CONFIG.DEFAULT_TIME_LIMIT;

  // ── Error state ─────────────────────────────────────────────────────────────
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <div className="text-center space-y-4">
          <p className="text-[#ff0099] text-lg font-bold">Game not found</p>
          <p className="text-[#8888aa] text-sm">{configError}</p>
          <button onClick={() => router.push("/")} className="text-[#00ff88] underline">← Back to Home</button>
        </div>
      </div>
    );
  }

  // ── Loading config ───────────────────────────────────────────────────────────
  if (!gameConfig || gameState === ENGINE_STATE.LOADING || !engine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#8888aa] text-sm">Loading {gameId}...</p>
        </div>
      </div>
    );
  }

  // ── Countdown overlay ────────────────────────────────────────────────────────
  if (gameState === ENGINE_STATE.COUNTDOWN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <div className="text-center space-y-4">
          <p className="text-[#8888aa] text-sm uppercase tracking-widest font-bold">Get Ready</p>
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="text-8xl font-black text-[#00ff88] drop-shadow-[0_0_30px_rgba(0,255,136,0.6)]"
          >
            {countdown || "GO!"}
          </motion.div>
          <p className="text-[#8888aa] text-sm">{gameConfig.meta.title}</p>
        </div>
      </div>
    );
  }

  // ── Game over overlay ────────────────────────────────────────────────────────
  if (gameState === ENGINE_STATE.GAME_OVER || gameState === ENGINE_STATE.RESULTS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-6xl">
            {gameState === ENGINE_STATE.GAME_OVER ? "💀" : "🏆"}
          </div>
          <p className="text-2xl font-black text-white">
            {gameState === ENGINE_STATE.GAME_OVER ? "Game Over" : "Complete!"}
          </p>
          <p className="text-4xl font-black text-[#00ff88]">{session?.score ?? 0}</p>
          <p className="text-[#8888aa] text-sm">Submitting score...</p>
        </motion.div>
      </div>
    );
  }

  // ── Playing state ────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <GameShell
        session={session}
        config={gameConfig}
        timeLimit={timeLimit}
        onTimerExpire={onTimerExpire}
        isActive={gameState === ENGINE_STATE.PLAYING}
        adaptive={adaptive}
      >
        {Plugin && (
          <Plugin
            config={gameConfig}
            onCorrect={onCorrect}
            onWrong={onWrong}
            onComplete={onComplete}
            isActive={gameState === ENGINE_STATE.PLAYING}
            adaptive={adaptive}
          />
        )}
      </GameShell>

      {/* Leaderboard toggle */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-72 max-h-[60vh] overflow-y-auto"
            >
              <Leaderboard gameId={gameId} currentPlayerName={playerName} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowLeaderboard(v => !v)}
          className="w-12 h-12 rounded-full bg-[#b44fff] text-white font-black text-xl shadow-[0_0_20px_rgba(180,79,255,0.4)] hover:scale-110 transition-transform flex items-center justify-center"
        >
          🏆
        </button>
      </div>
    </div>
  );
}
