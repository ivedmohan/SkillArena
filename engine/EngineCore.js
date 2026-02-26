/**
 * EngineCore.js — Master controller. Pure functions, no React.
 *
 * State machine: IDLE → LOADING → COUNTDOWN → PLAYING → GAME_OVER → RESULTS
 *                                                 ↕
 *                                       (plugin callbacks fire here)
 */
import { createSession, finalizeSession } from "./sessionManager";
import { applyCorrect, applyWrong, isGameOver } from "./ScoreEngine";

export const ENGINE_STATE = {
  IDLE:      "IDLE",
  LOADING:   "LOADING",
  COUNTDOWN: "COUNTDOWN",
  PLAYING:   "PLAYING",
  GAME_OVER: "GAME_OVER",
  RESULTS:   "RESULTS",
};

export function createEngineState(playerName, gameConfig) {
  return {
    gameState: ENGINE_STATE.IDLE,
    session: createSession(playerName, gameConfig.meta.gameId, gameConfig.meta),
    config: gameConfig,
    error: null,
  };
}

export function transition(state, newGameState) {
  return { ...state, gameState: newGameState };
}

/** Called by plugin: onCorrect(rawPoints) */
export function handleCorrect(state, rawPoints) {
  const session = applyCorrect(state.session, rawPoints);
  return { ...state, session };
}

/** Called by plugin: onWrong() */
export function handleWrong(state) {
  const session = applyWrong(state.session);
  const gameState = isGameOver(session) ? ENGINE_STATE.GAME_OVER : state.gameState;
  return { ...state, session, gameState };
}

/** Called by plugin: onComplete() */
export function handleComplete(state) {
  const session = finalizeSession(state.session);
  return { ...state, session, gameState: ENGINE_STATE.RESULTS };
}

/** Called when the main game timer hits zero */
export function handleTimerExpire(state) {
  if (state.gameState !== ENGINE_STATE.PLAYING) return state;
  const session = finalizeSession(state.session);
  return { ...state, session, gameState: ENGINE_STATE.GAME_OVER };
}
