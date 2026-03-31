/**
 * AdaptiveEngine.js — Real-time difficulty adaptation. Pure JS, no React.
 *
 * Tracks a rolling window of player answers and adjusts difficulty + timing
 * based on performance. This gives the engine "adaptive scoring" capability.
 *
 * Difficulty levels: 1 (easiest) → 5 (hardest)
 * The engine starts at the level matching the chosen difficulty (easy=2, medium=3, hard=4)
 */

const WINDOW_SIZE = 5; // rolling window of last N answers

const DIFFICULTY_NAMES = {
  1: "Beginner",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

/**
 * Create initial adaptive state.
 * @param {"easy"|"medium"|"hard"} baseDifficulty — the difficulty chosen by the player
 */
export function createAdaptiveState(baseDifficulty = "medium") {
  const startLevel =
    baseDifficulty === "easy" ? 2 :
    baseDifficulty === "hard" ? 4 : 3;

  return {
    level: startLevel,           // current difficulty level (1-5)
    history: [],                 // rolling window: true = correct, false = wrong
    totalCorrect: 0,
    totalWrong: 0,
    adjustments: 0,              // number of times difficulty was adjusted
    lastDirection: null,         // "up" | "down" | null
    timeAdjustment: 0,           // seconds to add/subtract from per-question timer
  };
}

/**
 * Record an answer and potentially adjust difficulty.
 * @param {object} state — current adaptive state
 * @param {boolean} isCorrect — whether the answer was correct
 * @returns {object} — new adaptive state
 */
export function recordAnswer(state, isCorrect) {
  const history = [...state.history, isCorrect].slice(-WINDOW_SIZE);
  const totalCorrect = state.totalCorrect + (isCorrect ? 1 : 0);
  const totalWrong = state.totalWrong + (isCorrect ? 0 : 1);

  let level = state.level;
  let lastDirection = null;
  let adjustments = state.adjustments;
  let timeAdjustment = state.timeAdjustment;

  // Only adjust after we have enough data
  if (history.length >= WINDOW_SIZE) {
    const recentCorrect = history.filter(Boolean).length;
    const accuracy = recentCorrect / WINDOW_SIZE;

    if (accuracy >= 0.8 && level < 5) {
      // Player is crushing it → make it harder
      level += 1;
      lastDirection = "up";
      adjustments += 1;
      timeAdjustment = Math.max(timeAdjustment - 2, -6); // reduce time per Q (max -6s)
    } else if (accuracy <= 0.3 && level > 1) {
      // Player is struggling → make it easier
      level -= 1;
      lastDirection = "down";
      adjustments += 1;
      timeAdjustment = Math.min(timeAdjustment + 3, 6); // add time per Q (max +6s)
    }
  }

  return {
    level,
    history,
    totalCorrect,
    totalWrong,
    adjustments,
    lastDirection,
    timeAdjustment,
  };
}

/**
 * Get the current adaptive difficulty level (1-5).
 */
export function getAdaptiveLevel(state) {
  return state.level;
}

/**
 * Get human-readable difficulty name.
 */
export function getAdaptiveDifficultyName(state) {
  return DIFFICULTY_NAMES[state.level] || "Medium";
}

/**
 * Get time adjustment in seconds (negative = faster, positive = more time).
 */
export function getTimeAdjustment(state) {
  return state.timeAdjustment;
}

/**
 * Get rolling accuracy (0-1).
 */
export function getRollingAccuracy(state) {
  if (state.history.length === 0) return 1;
  return state.history.filter(Boolean).length / state.history.length;
}

/**
 * Pick questions appropriate for the current difficulty level.
 * Maps adaptive level to question difficulty filters.
 */
export function getQuestionDifficultyFilter(level) {
  if (level <= 1) return ["easy"];
  if (level === 2) return ["easy", "medium"];
  if (level === 3) return ["easy", "medium", "hard"];
  if (level === 4) return ["medium", "hard"];
  return ["hard"];
}
