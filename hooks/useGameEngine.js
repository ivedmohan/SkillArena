"use client";
import { useState, useCallback, useRef } from "react";
import { GAME_STATE, processAnswer, isGameOver, isRoundComplete, buildResultsSummary } from "../engine/gameEngine";
import { createSession, applyDelta, serialiseSession } from "../engine/sessionManager";
import { loadQuestionSet } from "../engine/questionLoader";
import { updatePlayerState } from "../lib/firestoreHelpers";
import { GAME_CONFIG } from "../constants/gameConfig";

/**
 * useGameEngine — React wrapper around the pure game engine.
 *
 * @param {string} roomId
 * @param {string} playerId
 * @param {string} playerName
 */
export function useGameEngine(roomId, playerId, playerName) {
  const [gameState, setGameState] = useState(GAME_STATE.IDLE);
  const [questionSet, setQuestionSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [lastResult, setLastResult] = useState(null); // { correct, pointsEarned }
  const [results, setResults] = useState(null);
  const [countdown, setCountdown] = useState(GAME_CONFIG.COUNTDOWN_BEFORE_START);

  const startTimeRef = useRef(null);

  // ── Load & start game ──────────────────────────────────────────────────────

  const startGame = useCallback(async (questionSetUrl, livesOverride) => {
    setGameState(GAME_STATE.LOADING);
    try {
      const qs = await loadQuestionSet(questionSetUrl);
      const sess = createSession(playerId, playerName, livesOverride ?? qs.meta.totalLives);
      setQuestionSet(qs);
      setSession(sess);
      setCurrentIndex(0);
      setLastResult(null);
      setResults(null);

      // countdown
      setGameState(GAME_STATE.COUNTDOWN);
      let c = GAME_CONFIG.COUNTDOWN_BEFORE_START;
      setCountdown(c);
      const tick = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(tick);
          setGameState(GAME_STATE.PLAYING);
          startTimeRef.current = Date.now();
        }
      }, 1000);
    } catch (err) {
      console.error("startGame error:", err);
      setGameState(GAME_STATE.IDLE);
    }
  }, [playerId, playerName]);

  // ── Answer submission ──────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (selectedAnswer) => {
    if (gameState !== GAME_STATE.PLAYING || !session || !questionSet) return;

    const question = questionSet.questions[currentIndex];
    const secondsTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : question.timePerQuestion;

    const delta = processAnswer(session, question, selectedAnswer, secondsTaken);
    const updatedSession = applyDelta(session, delta);

    setSession(updatedSession);
    setLastResult({
      correct: selectedAnswer === question.answer,
      pointsEarned: delta.score ? delta.score - session.score : 0,
      correctAnswer: question.answer,
      explanation: question.explanation,
    });
    setGameState(GAME_STATE.ANSWER_REVEAL);

    // persist to Firestore
    if (roomId) {
      try {
        await updatePlayerState(roomId, playerId, serialiseSession(updatedSession));
      } catch (e) {
        console.error("Firestore update failed:", e);
      }
    }

    // check game over
    if (isGameOver(updatedSession)) {
      setTimeout(() => {
        setResults(buildResultsSummary(updatedSession, questionSet.questions));
        setGameState(GAME_STATE.RESULTS);
      }, GAME_CONFIG.ANSWER_REVEAL_DURATION);
      return;
    }

    // advance to next question after reveal
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (isRoundComplete(nextIndex, questionSet.questions.length)) {
        setResults(buildResultsSummary(updatedSession, questionSet.questions));
        setGameState(GAME_STATE.ROUND_END);
      } else {
        setCurrentIndex(nextIndex);
        setGameState(GAME_STATE.PLAYING);
        startTimeRef.current = Date.now();
      }
    }, GAME_CONFIG.ANSWER_REVEAL_DURATION);
  }, [gameState, session, questionSet, currentIndex, roomId, playerId]);

  // ── Timer expire ───────────────────────────────────────────────────────────

  const handleTimerExpire = useCallback(() => {
    if (gameState === GAME_STATE.PLAYING) {
      submitAnswer(null); // null = timed out, counts as wrong
    }
  }, [gameState, submitAnswer]);

  const currentQuestion = questionSet?.questions[currentIndex] ?? null;

  return {
    gameState,
    questionSet,
    currentQuestion,
    currentIndex,
    session,
    lastResult,
    results,
    countdown,
    startGame,
    submitAnswer,
    handleTimerExpire,
  };
}
