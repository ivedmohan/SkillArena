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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Room code card */}
          <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 mb-4 text-center">
            <p className="text-xs uppercase tracking-widest text-[#8888aa] mb-2">Room Code</p>
            <button
              onClick={copyCode}
              className="text-5xl font-black tracking-widest text-[#00ff88] drop-shadow-[0_0_20px_#00ff8888] hover:scale-105 transition-transform active:scale-95 font-mono"
              title="Click to copy"
            >
              {roomId}
            </button>
            <p className="text-xs text-[#8888aa] mt-2">Tap code to copy · Share with friends</p>
            {questionSetId && QUESTION_SETS[questionSetId] && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f0f1a] border border-[#2a2a4a] text-xs text-[#8888aa]">
                <span>📚</span>
                <span>{QUESTION_SETS[questionSetId].label}</span>
                <span>·</span>
                <span>{QUESTION_SETS[questionSetId].difficulty}</span>
              </div>
            )}
          </div>

          {/* Players in lobby */}
          <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-5 mb-4">
            <p className="text-xs uppercase tracking-widest text-[#8888aa] mb-3 font-semibold">
              Players in lobby ({players.length})
            </p>
            {players.length === 0 ? (
              <p className="text-[#8888aa] text-sm animate-pulse">Waiting for players to join…</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                    <span className="text-white font-medium">{p.name}</span>
                    {p.id === playerId && (
                      <span className="text-[#b44fff] text-xs">(you)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Host: Start button | Non-host: Waiting message */}
          {isHost ? (
            <button
              onClick={handleHostStart}
              disabled={starting || players.length === 0}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95 ${
                starting || players.length === 0
                  ? "bg-[#2a2a4a] text-[#44446a] cursor-not-allowed"
                  : "bg-[#00ff88] text-[#0f0f1a] hover:shadow-[0_0_30px_#00ff8888]"
              }`}
            >
              {starting ? "Starting…" : `Start Game →`}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl border border-[#2a2a4a] text-center">
              <p className="text-[#8888aa] animate-pulse text-sm">Waiting for host to start…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!playerId || gameState === GAME_STATE.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚔️</div>
          <p className="text-[#8888aa] animate-pulse">Loading arena…</p>
        </div>
      </div>
    );
  }

  // ─── Countdown ─────────────────────────────────────────────────────────────
  if (gameState === GAME_STATE.COUNTDOWN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          key={countdown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-center"
        >
          <div className="text-9xl font-black text-[#00ff88] drop-shadow-[0_0_30px_#00ff88]">
            {countdown}
          </div>
          <p className="text-[#8888aa] mt-4 text-lg">Get ready…</p>
        </motion.div>
      </div>
    );
  }

  // ─── Playing / Answer Reveal ───────────────────────────────────────────────
  const isRevealed = gameState === GAME_STATE.ANSWER_REVEAL;
  const totalQ = questionSet?.questions.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-6 gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <LifeBar lives={session?.lives ?? 3} maxLives={questionSet?.meta.totalLives ?? 3} />
        <div className="text-center">
          <span className="text-xs text-[#8888aa] uppercase tracking-widest">
            Q {currentIndex + 1} / {totalQ}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8888aa]">Score</span>
          <span className="font-black text-[#00ff88] text-lg tabular-nums">
            {session?.score ?? 0}
          </span>
        </div>
      </div>

      {/* Timer */}
      <Timer
        key={`timer-${currentIndex}`}
        duration={currentQuestion?.timePerQuestion ?? GAME_CONFIG.DEFAULT_TIME_PER_QUESTION}
        onExpire={handleTimerExpire}
        active={gameState === GAME_STATE.PLAYING}
      />

      {/* Combo */}
      <div className="flex justify-center min-h-[40px]">
        <ComboIndicator combo={session?.combo ?? 1} />
      </div>

      {/* Question Card */}
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

      {/* Answer Reveal Banner */}
      <AnimatePresence>
        {isRevealed && lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl p-4 border text-center ${
              lastResult.correct
                ? "border-[#00ff88] bg-[#00ff8811]"
                : "border-[#ff0099] bg-[#ff009911]"
            }`}
          >
            <p className={`font-black text-xl mb-1 ${lastResult.correct ? "text-[#00ff88]" : "text-[#ff0099]"}`}>
              {lastResult.correct ? `+${lastResult.pointsEarned} pts! ✓` : "Wrong! ✗"}
            </p>
            <p className="text-[#8888aa] text-sm">{lastResult.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard toggle */}
      <div className="mt-auto pt-4 border-t border-[#2a2a4a]">
        <button
          onClick={() => setShowLeaderboard((v) => !v)}
          className="text-xs text-[#8888aa] hover:text-[#b44fff] transition-colors"
        >
          {showLeaderboard ? "Hide" : "Show"} Leaderboard ↕
        </button>
        {showLeaderboard && (
          <div className="mt-3">
            <Leaderboard roomId={roomId} currentPlayerId={playerId} />
          </div>
        )}
      </div>
    </div>
  );
}
