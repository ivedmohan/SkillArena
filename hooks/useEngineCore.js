"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ENGINE_STATE,
  createEngineState,
  handleCorrect,
  handleWrong,
  handleComplete,
  handleTimerExpire,
} from "../engine/EngineCore";
import { loadPlugin } from "../engine/PluginLoader";
import { submitFinalScore } from "../engine/LeaderboardEngine";
import { GAME_CONFIG } from "../constants/gameConfig";

/**
 * useEngineCore — React wrapper for the pure EngineCore state machine.
 *
 * @param {string} playerName
 * @param {object|null} gameConfig  — full config.json object (meta + config)
 */
export function useEngineCore(playerName, gameConfig, gameSlug) {
  const [engine, setEngine] = useState(null);
  const [Plugin, setPlugin] = useState(null);
  const [countdown, setCountdown] = useState(GAME_CONFIG.COUNTDOWN_BEFORE_START);
  const countdownRef = useRef(null);
  const submitRef = useRef(false);

  useEffect(() => {
    if (!playerName || !gameConfig) return;
    submitRef.current = false;

    const init = async () => {
      // LOADING state
      setEngine({
        ...createEngineState(playerName, gameConfig, gameSlug),
        gameState: ENGINE_STATE.LOADING,
      });

      try {
        const GamePlugin = await loadPlugin(gameConfig.meta.gameId);
        setPlugin(() => GamePlugin);

        // COUNTDOWN state
        setEngine(prev => ({ ...prev, gameState: ENGINE_STATE.COUNTDOWN }));
        let count = GAME_CONFIG.COUNTDOWN_BEFORE_START;
        setCountdown(count);

        countdownRef.current = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(countdownRef.current);
            setEngine(prev => ({ ...prev, gameState: ENGINE_STATE.PLAYING }));
          }
        }, 1000);
      } catch (err) {
        setEngine(prev => ({ ...prev, gameState: ENGINE_STATE.IDLE, error: err.message }));
      }
    };

    init();
    return () => clearInterval(countdownRef.current);
  }, [playerName, gameConfig]);

  // Auto-submit score when game ends
  useEffect(() => {
    if (!engine) return;
    const { gameState, session, config } = engine;
    if (
      (gameState === ENGINE_STATE.RESULTS || gameState === ENGINE_STATE.GAME_OVER) &&
      !submitRef.current
    ) {
      submitRef.current = true;
      submitFinalScore({
        playerName: session.playerName,
        gameId: session.gameId,
        score: session.score,
        timeTaken: session.timeTaken ?? 0,
        difficulty: config?.meta?.difficulty ?? "medium",
      });
    }
  }, [engine?.gameState]); // eslint-disable-line

  const onCorrect = useCallback((rawPoints) => {
    setEngine(prev => prev ? handleCorrect(prev, rawPoints) : prev);
  }, []);

  const onWrong = useCallback(() => {
    setEngine(prev => prev ? handleWrong(prev) : prev);
  }, []);

  const onComplete = useCallback(() => {
    setEngine(prev => prev ? handleComplete(prev) : prev);
  }, []);

  const onTimerExpire = useCallback(() => {
    setEngine(prev => prev ? handleTimerExpire(prev) : prev);
  }, []);

  const adaptive = engine?.adaptive ?? null;

  return { engine, Plugin, countdown, onCorrect, onWrong, onComplete, onTimerExpire, adaptive };
}
