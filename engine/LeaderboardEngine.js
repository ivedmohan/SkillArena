/**
 * LeaderboardEngine.js — Score submission and retrieval.
 */
import { submitScore, getTopScores } from "../lib/firestoreHelpers";

export async function submitFinalScore({ playerName, gameId, score, timeTaken, difficulty }) {
  try {
    return await submitScore({ playerName, gameId, score, timeTaken, difficulty });
  } catch (err) {
    console.warn("LeaderboardEngine: score submit failed", err);
    return null;
  }
}

export async function fetchTopScores(gameId, limit = 10) {
  try {
    return await getTopScores(gameId, limit);
  } catch (err) {
    console.warn("LeaderboardEngine: fetch failed", err);
    return [];
  }
}
