"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { useGameEngine } from "../../../hooks/useGameEngine";
import { GAME_STATE } from "../../../engine/gameEngine";
import { GAME_CONFIG } from "../../../constants/gameConfig";
import { updateRoomStatus, subscribeToRoom, getRoom } from "../../../lib/firestoreHelpers";
import { useLeaderboard } from "../../../hooks/useLeaderboard";
import { getQuestionSetUrl, QUESTION_SETS } from "../../../constants/questionSets";

import QuestionCard from "../../../components/QuestionCard";
import Timer from "../../../components/Timer";
import LifeBar from "../../../components/LifeBar";
import ComboIndicator from "../../../components/ComboIndicator";
import Leaderboard from "../../../components/Leaderboard";

export default function GamePage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [questionSetUrl, setQuestionSetUrl] = useState(null);
  const [questionSetId, setQuestionSetId] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [starting, setStarting] = useState(false);

  const {
    gameState,
    currentQuestion,
    currentIndex,
    questionSet,
    session,
    lastResult,
    results,
    countdown,
    startGame,
    submitAnswer,
    handleTimerExpire,
  } = useGameEngine(roomId, playerId, playerName);

  const { players } = useLeaderboard(roomId);

  // ── Read identity + fetch room's question set ──────────────────────────────
  useEffect(() => {
    const id   = sessionStorage.getItem("playerId");
    const name = sessionStorage.getItem("playerName");
    const host = sessionStorage.getItem("isHost") === "true";
    if (!id || !name) { router.replace("/"); return; }
    setPlayerId(id);
    setPlayerName(name);
    setIsHost(host);

    // Fetch room to get the chosen question set
    getRoom(roomId).then((room) => {
      if (room) {
        setQuestionSetId(room.questionSetId);
        setQuestionSetUrl(getQuestionSetUrl(room.questionSetId));
      }
    });
  }, [router, roomId]);

  // ── Non-host: watch room status → start when host fires it ────────────────
  useEffect(() => {
    if (!roomId || !playerId || isHost || !questionSetUrl) return;
    const unsub = subscribeToRoom(roomId, (room) => {
      if (room.status === "playing" && gameState === GAME_STATE.IDLE) {
        startGame(questionSetUrl);
      }
    });
    return unsub;
  }, [roomId, playerId, isHost, gameState, startGame, questionSetUrl]);

  // ── Reset selected answer on new question ─────────────────────────────────
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) setSelectedAnswer(null);
  }, [gameState, currentIndex]);

  // ── Navigate to results ───────────────────────────────────────────────────
  useEffect(() => {
    if ((gameState === GAME_STATE.RESULTS || gameState === GAME_STATE.ROUND_END) && results) {
      const encoded = encodeURIComponent(JSON.stringify(results));
      router.push(`/results?data=${encoded}`);
    }
  }, [gameState, results, router]);

  function handleAnswer(opt) {
    setSelectedAnswer(opt);
    submitAnswer(opt);
  }

  // ── Host: start game for everyone ─────────────────────────────────────────
  async function handleHostStart() {
    setStarting(true);
    await updateRoomStatus(roomId, "playing");
    startGame(questionSetUrl);
  }

  // ── Copy room code to clipboard ───────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(roomId).catch(() => {});
  }

  // ─── LOBBY ────────────────────────────────────────────────────────────────
  if (playerId && gameState === GAME_STATE.IDLE) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ff88] rounded-full blur-[120px] opacity-[0.05]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b44fff] rounded-full blur-[120px] opacity-[0.05]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/5 relative z-10"
        >
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-[#8888aa] mb-2 font-bold">Room Code</p>
            <button
              onClick={copyCode}
              className="text-6xl font-black tracking-widest text-[#00ff88] drop-shadow-[0_0_25px_rgba(0,255,136,0.5)] hover:scale-105 transition-transform active:scale-95 font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#00ff88] to-[#00cc6a]"
              title="Click to copy"
            >
              {roomId}
            </button>
            <p className="text-xs text-[#8888aa] mt-3 font-medium">Tap code to copy · Share with friends</p>
            
            {questionSetId && QUESTION_SETS?.[questionSetId] && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#b44fff]">
                <span>📚 {QUESTION_SETS[questionSetId].label}</span>
                <span className="text-white/20">|</span>
                <span>{QUESTION_SETS[questionSetId].difficulty}</span>
              </div>
            )}
          </div>

          <div className="bg-[#0f0f1a]/50 border border-white/5 rounded-2xl p-6 mb-8 min-h-[120px]">
            <p className="text-xs uppercase tracking-widest text-[#8888aa] mb-4 font-bold flex justify-between">
              <span>Players in lobby</span>
              <span className="bg-[#2a2a4a] px-2 py-0.5 rounded text-white">{players.length}</span>
            </p>
            
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-20 text-[#8888aa]/50 text-sm animate-pulse gap-2">
                <span className="text-2xl">⏳</span>
                <span>Waiting for players...</span>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {players.map((p) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={p.id} 
                    className="flex items-center gap-3 text-sm bg-white/5 p-2 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center text-[#0f0f1a] font-bold text-xs uppercase">
                      {p.name.substring(0,2)}
                    </div>
                    <span className="text-white font-semibold">{p.name}</span>
                    {p.id === playerId && (
                      <span className="ml-auto text-[10px] uppercase bg-[#b44fff] text-white px-1.5 py-0.5 rounded">You</span>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {isHost ? (
            <button
              onClick={handleHostStart}
              disabled={starting || players.length === 0}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wide transition-all active:scale-[0.98] ${
                starting || players.length === 0
                  ? "bg-[#2a2a4a] text-[#44446a] cursor-not-allowed border border-transparent"
                  : "bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#0f0f1a] shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:shadow-[0_0_30px_rgba(0,255,136,0.6)]"
              }`}
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                   <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                   Starting...
                </span>
              ) : "Start Game 🚀"}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl border border-white/10 bg-white/5 text-center">
              <p className="text-[#8888aa] animate-pulse text-sm font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b44fff] animate-ping"></span>
                Waiting for host to start...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!playerId || gameState === GAME_STATE.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b44fff22] via-[#0f0f1a] to-[#0f0f1a]" />
        <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center glass-panel p-10 rounded-3xl"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-6 inline-block drop-shadow-[0_0_15px_rgba(180,79,255,0.5)]"
          >
            ⚔️
          </motion.div>
          <p className="text-white font-bold text-2xl mb-2 tracking-tight">Entering Arena</p>
          <p className="text-[#8888aa] text-sm font-mono animate-pulse">Synchronizing battle data...</p>
        </motion.div>
      </div>
    );
  }

  // ─── Countdown ─────────────────────────────────────────────────────────────
  if (gameState === GAME_STATE.COUNTDOWN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00ff8833] via-[#0f0f1a] to-[#0f0f1a]" />
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center relative z-10"
          >
            <div className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00ff88] drop-shadow-[0_0_50px_rgba(0,255,136,0.5)]">
              {countdown}
            </div>
            <p className="text-[#00ff88] font-bold text-2xl uppercase tracking-[0.5em] mt-8 animate-pulse">Get Ready</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ─── Playing / Answer Reveal ───────────────────────────────────────────────
  const isRevealed = gameState === GAME_STATE.ANSWER_REVEAL;
  const totalQ = questionSet?.questions.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4 py-4 md:py-8 gap-6 relative">
      {/* Background flair */}
      <div className="fixed top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#b44fff] via-[#00ff88] to-[#b44fff] opacity-50 z-500" />
      
      {/* Top bar */}
      <header className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm sticky top-4 z-40">
        <LifeBar lives={session?.lives ?? 3} maxLives={questionSet?.meta.totalLives ?? 3} />
        
        <div className="bg-[#0f0f1a] px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
          <span className="text-xs font-bold text-[#8888aa] uppercase tracking-widest">
            Question {currentIndex + 1} <span className="text-[#444466]">/</span> {totalQ}
          </span>
        </div>
        
        <div className="flex flex-col items-end leading-none">
          <span className="text-[10px] uppercase font-bold text-[#8888aa] mb-1">Score</span>
          <span className="font-black text-2xl text-[#00ff88] tabular-nums drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
            {session?.score ?? 0}
          </span>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        {/* Timer */}
        <div className="mb-8">
            <Timer
            key={`timer-${currentIndex}`}
            duration={currentQuestion?.timePerQuestion ?? GAME_CONFIG.DEFAULT_TIME_PER_QUESTION}
            onExpire={handleTimerExpire}
            active={gameState === GAME_STATE.PLAYING}
            />
        </div>

        {/* Combo */}
        <div className="flex justify-center min-h-[60px] mb-4">
            <ComboIndicator combo={session?.combo ?? 1} />
        </div>

        {/* Question Card */}
        <div className="relative">
            <AnimatePresence mode="wait">
            {currentQuestion && (
                <QuestionCard
                key={`q-${currentIndex}`}
                question={currentQuestion.question}
                options={currentQuestion.options}
                onAnswer={handleAnswer}
                disabled={isRevealed || gameState !== GAME_STATE.PLAYING}
                selectedAnswer={selectedAnswer}
                correctAnswer={currentQuestion.answer}
                revealed={isRevealed}
                />
            )}
            </AnimatePresence>

            {/* Answer Reveal Overlay (Feedback) */}
            <AnimatePresence>
                {isRevealed && lastResult && (
                    <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50`}
                    >
                    <div className={`p-8 rounded-3xl border-4 shadow-2xl backdrop-blur-md transform rotate-[-2deg] ${
                        lastResult.correct
                        ? "bg-[#00ff88]/90 border-[#00ff88] text-[#0f0f1a]"
                        : "bg-[#ff0099]/90 border-[#ff0099] text-white"
                    }`}>
                        <p className="font-black text-4xl mb-2 text-center uppercase tracking-tight">
                        {lastResult.correct ? "Excellent!" : "Missed!"}
                        </p>
                        <p className="font-bold text-center text-xl opacity-90">
                        {lastResult.correct ? `+${lastResult.pointsEarned} PTS` : "Streak Reset"}
                        </p>
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      
        {/* Explanation (Shown below card) */}
        <AnimatePresence>
            {isRevealed && lastResult && (
                 <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 className="mt-6 p-6 rounded-2xl bg-[#16213e] border border-[#2a2a4a] text-center max-w-2xl mx-auto overflow-hidden"
               >
                 <p className="text-[#8888aa] text-xs uppercase font-bold tracking-widest mb-2">Explanation</p>
                 <p className="text-white text-lg leading-relaxed">{lastResult.explanation}</p>
               </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* Leaderboard toggle */}
      <footer className="mt-auto pt-4 pb-2 text-center">
        <button
          onClick={() => setShowLeaderboard((v) => !v)}
          className="group flex flex-col items-center mx-auto"
        >
          <div className="w-8 h-1 bg-[#2a2a4a] rounded-full group-hover:bg-[#b44fff] transition-colors mb-2" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#8888aa] group-hover:text-white transition-colors">
            {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
          </span>
        </button>
        
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mt-4 overflow-hidden"
            >
              <Leaderboard roomId={roomId} currentPlayerId={playerId} />
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
