import { GAME_CONFIG } from "../../constants/gameConfig";

/** Check if the selected option is correct. */
export function isCorrect(question, selectedOption) {
  return selectedOption === question.answer;
}

/** Calculate points for a correct answer including time bonus. */
export function calcPoints(question, secondsTaken) {
  const base = question.points ?? 10;
  const tiers = GAME_CONFIG.TIME_BONUS_TIERS;
  const thresholds = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  let bonus = 0;
  for (const t of thresholds) {
    if (secondsTaken <= t) { bonus = tiers[t]; break; }
  }
  return base + bonus;
}
