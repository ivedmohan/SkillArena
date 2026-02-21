import { GAME_CONFIG } from "../constants/gameConfig";

/**
 * Creates a fresh player session state object.
 */
export function createSession(playerId, name, totalLives) {
  return {
    playerId,
    name,
    score: 0,
    lives: totalLives ?? GAME_CONFIG.DEFAULT_LIVES,
    combo: 1,        // starts at 1 (no multiplier yet); becomes 2 after first correct
    answeredQuestions: [],
    weakTopics: {},
    joinedAt: Date.now(),
  };
}

/**
 * Merges a state delta (returned by processAnswer) into the current session.
 * Returns a new session object — does not mutate.
 */
export function applyDelta(session, delta) {
  return { ...session, ...delta };
}

/**
 * Serialises a session to a plain object safe for Firestore writes.
 */
export function serialiseSession(session) {
  return {
    name: session.name,
    score: session.score,
    lives: session.lives,
    combo: session.combo,
    answeredQuestions: session.answeredQuestions,
    weakTopics: session.weakTopics,
  };
}
