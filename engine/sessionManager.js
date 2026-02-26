/**
 * SessionManager.js — Player session state for a single game run.
 */

export function createSession(playerName, gameId, gameMeta) {
  return {
    playerName,
    gameId,
    score: 0,
    lives: gameMeta.lives ?? 3,
    streak: 0,
    multiplier: 1.0,
    lastPointsEarned: 0,
    startedAt: Date.now(),
    completedAt: null,
    timeTaken: 0,
  };
}

export function finalizeSession(session) {
  const now = Date.now();
  return {
    ...session,
    completedAt: now,
    timeTaken: Math.round((now - session.startedAt) / 1000),
  };
}
