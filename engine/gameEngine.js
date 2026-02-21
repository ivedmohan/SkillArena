/**
 * gameEngine.js — Pure functions. No React. No side effects.
 *
 * All game logic lives here: scoring, combo, lives, state transitions.
 */
import { GAME_CONFIG } from "../constants/gameConfig";

// ─── Game States ──────────────────────────────────────────────────────────────

export const GAME_STATE = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  COUNTDOWN: "COUNTDOWN",
  PLAYING: "PLAYING",
  ANSWER_REVEAL: "ANSWER_REVEAL",
  NEXT_QUESTION: "NEXT_QUESTION",
  ROUND_END: "ROUND_END",
  RESULTS: "RESULTS",
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Calculates time bonus based on seconds taken to answer.
 */
export function calcTimeBonus(secondsTaken) {
  const tiers = GAME_CONFIG.TIME_BONUS_TIERS;
  const thresholds = Object.keys(tiers)
    .map(Number)
    .sort((a, b) => a - b);

  for (const t of thresholds) {
    if (secondsTaken <= t) return tiers[t];
  }
  return 0;
}

/**
 * Returns the combo multiplier for a given consecutive correct streak.
 */
export function getComboMultiplier(streak) {
  const thresholds = Object.keys(GAME_CONFIG.COMBO_THRESHOLDS)
    .map(Number)
    .sort((a, b) => b - a); // descending — match highest first

  for (const t of thresholds) {
    if (streak >= t) return GAME_CONFIG.COMBO_THRESHOLDS[t];
  }
  return 1.0;
}

/**
 * Calculates points earned for a correct answer.
 */
export function calcPoints(basePoints, secondsTaken, streak) {
  const timeBonus = calcTimeBonus(secondsTaken);
  const multiplier = getComboMultiplier(streak);
  return Math.round((basePoints + timeBonus) * multiplier);
}

// ─── Answer processing ────────────────────────────────────────────────────────

/**
 * Processes a player's answer. Returns the next player state delta.
 *
 * @param {object} playerState  - current player state
 * @param {object} question     - current question object
 * @param {string|null} answer  - selected option, or null if timed out
 * @param {number} secondsTaken - seconds elapsed when answering
 * @returns {object} updated player state fields
 */
export function processAnswer(playerState, question, answer, secondsTaken) {
  const isCorrect = answer !== null && answer === question.answer;

  if (!isCorrect) {
    return {
      lives: playerState.lives - 1,
      combo: 1,
      answeredQuestions: [
        ...playerState.answeredQuestions,
        { questionId: question.id, correct: false, answer },
      ],
      weakTopics: {
        ...playerState.weakTopics,
        [question.topic]: (playerState.weakTopics[question.topic] ?? 0) + 1,
      },
    };
  }

  const newStreak = playerState.combo + 1; // combo tracks next streak level
  const pointsEarned = calcPoints(question.points, secondsTaken, playerState.combo);

  return {
    score: playerState.score + pointsEarned,
    combo: newStreak,
    answeredQuestions: [
      ...playerState.answeredQuestions,
      { questionId: question.id, correct: true, answer, pointsEarned },
    ],
    weakTopics: playerState.weakTopics,
    lives: playerState.lives,
  };
}

// ─── Game flow helpers ────────────────────────────────────────────────────────

export function isGameOver(playerState) {
  return playerState.lives <= 0;
}

export function isRoundComplete(questionIndex, totalQuestions) {
  return questionIndex >= totalQuestions;
}

/**
 * Derives the result summary for the results page.
 */
export function buildResultsSummary(playerState, questions) {
  const correct = playerState.answeredQuestions.filter((a) => a.correct).length;
  const total = playerState.answeredQuestions.length;
  return {
    score: playerState.score,
    correct,
    total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    weakTopics: playerState.weakTopics,
    livesRemaining: playerState.lives,
  };
}
