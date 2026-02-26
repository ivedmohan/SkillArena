import { GAME_CONFIG } from "../../constants/gameConfig";
import WORD_LIST from "../../lib/wordList";

/**
 * Check if a word can be formed from the available letter pool.
 * Each letter can only be used as many times as it appears in the pool.
 */
export function canFormWord(word, letters) {
  const pool = [...letters.map(l => l.toUpperCase())];
  for (const char of word.toUpperCase()) {
    const idx = pool.indexOf(char);
    if (idx === -1) return false;
    pool.splice(idx, 1);
  }
  return true;
}

/** Check if the word exists in the bundled English dictionary. */
export function isRealWord(word) {
  return WORD_LIST.has(word.toLowerCase());
}

/**
 * Full validation. Returns { valid: boolean, reason: string }.
 * Checks: min length → can form from tiles → not already found → real word.
 */
export function validateWord(word, round, foundWords) {
  const w = word.toUpperCase().trim();
  const minLen = round.minWordLength ?? GAME_CONFIG.MIN_WORD_LENGTH;

  if (w.length < minLen) {
    return { valid: false, reason: `Need ${minLen}+ letters` };
  }
  if (!canFormWord(w, round.letters)) {
    return { valid: false, reason: "Can't form from tiles" };
  }
  if (foundWords.includes(w)) {
    return { valid: false, reason: "Already found!" };
  }
  if (!isRealWord(w)) {
    return { valid: false, reason: "Not a valid word" };
  }
  return { valid: true, reason: "" };
}

/** Calculate points for a valid word including bonus. */
export function calcWordPoints(word, round) {
  const w = word.toUpperCase();
  const base = w.length * (round.pointsPerLetter ?? 5);
  const isBonus = (round.bonusWords ?? []).map(b => b.toUpperCase()).includes(w);
  return isBonus ? base * (round.bonusMultiplier ?? 2) : base;
}
