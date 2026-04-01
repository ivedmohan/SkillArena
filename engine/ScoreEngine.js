/**
 * ScoreEngine.js — Pure scoring functions. No React. Fully testable.
 */
import { GAME_CONFIG } from "../constants/gameConfig";

export function calcTimeBonus(secondsTaken) {
  const tiers = GAME_CONFIG.TIME_BONUS_TIERS;
  const thresholds = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  for (const t of thresholds) {
    if (secondsTaken <= t) return tiers[t];
  }
  return 0;
}

export function getComboMultiplier(streak) {
  const thresholds = Object.keys(GAME_CONFIG.COMBO_THRESHOLDS)
    .map(Number)
    .sort((a, b) => b - a);
  for (const t of thresholds) {
    if (streak >= t) return GAME_CONFIG.COMBO_THRESHOLDS[t];
  }
  return 1.0;
}

/**
 * Apply a correct answer to the session.
 * rawPoints = base + time bonus (computed by plugin since plugin knows timing).
 * Engine applies combo multiplier on top.
 */
export function applyCorrect(session, rawPoints) {
  const multiplier = getComboMultiplier(session.streak);
  const points = Math.round(rawPoints * multiplier);
  return {
    ...session,
    score: session.score + points,
    streak: session.streak + 1,
    lastPointsEarned: points,
    multiplier,
  };
}

export function applyWrong(session) {
  return {
    ...session,
    lives: typeof session.lives === "number" ? session.lives - 1 : session.lives,
    streak: 0,
    multiplier: 1.0,
    lastPointsEarned: 0,
  };
}

export function isGameOver(session) {
  return typeof session.lives === "number" && session.lives <= 0;
}
