/**
 * TimerEngine.js — Pure countdown logic.
 * React components use the useTimer hook; this module is the pure-function core.
 */

export function createTimerState(duration) {
  return { duration, timeLeft: duration };
}

export function tick(state) {
  return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
}

export function isExpired(state) {
  return state.timeLeft <= 0;
}

export function resetTimer(state, newDuration) {
  const d = newDuration ?? state.duration;
  return { duration: d, timeLeft: d };
}

/**
 * Calculates the time bonus for how fast a player answered.
 * bonusTiers example: { 5: 5, 10: 2 } → answered in ≤5s gets +5pts
 */
export function calcTimeBonusForSeconds(secondsTaken, bonusTiers) {
  const thresholds = Object.keys(bonusTiers).map(Number).sort((a, b) => a - b);
  for (const t of thresholds) {
    if (secondsTaken <= t) return bonusTiers[t];
  }
  return 0;
}
