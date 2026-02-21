import { GAME_CONFIG } from "../constants/gameConfig";

/**
 * Validates that a question set JSON matches the required schema.
 * Throws with a descriptive message on first violation found.
 */
export function validateQuestionSet(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid JSON: root must be an object.");
  if (!data.meta) throw new Error("Missing required field: meta");
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("Missing or empty questions array.");
  }

  const required = ["title", "category", "difficulty", "version"];
  for (const field of required) {
    if (!data.meta[field]) throw new Error(`meta.${field} is required.`);
  }

  data.questions.forEach((q, i) => {
    if (!q.id)          throw new Error(`questions[${i}] missing id.`);
    if (!q.question)    throw new Error(`questions[${i}] missing question.`);
    if (!Array.isArray(q.options) || q.options.length !== 4)
      throw new Error(`questions[${i}] must have exactly 4 options.`);
    if (!q.answer)      throw new Error(`questions[${i}] missing answer.`);
    if (!q.options.includes(q.answer))
      throw new Error(`questions[${i}]: answer must exactly match one option.`);
    if (!q.topic)       throw new Error(`questions[${i}] missing topic.`);
    if (!q.explanation) throw new Error(`questions[${i}] missing explanation.`);
  });

  return true;
}

/**
 * Fisher–Yates shuffle — returns a new shuffled array.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Loads a question set from a public URL (/public/questions/).
 * Returns a normalised, shuffled question set object.
 */
export async function loadQuestionSet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch question set: ${res.status}`);
  const data = await res.json();
  validateQuestionSet(data);
  return normaliseQuestionSet(data);
}

/**
 * Loads a question set from a raw data object (from Firestore).
 * Use this instead of loadQuestionSet when the data is already in memory.
 */
export function loadQuestionSetFromData(data) {
  validateQuestionSet(data);
  return normaliseQuestionSet(data);
}

/**
 * Normalises a raw validated question-set object:
 * - fills defaults for optional fields
 * - shuffles questions
 */
export function normaliseQuestionSet(data) {
  const timePerQuestion =
    data.meta.timePerQuestion ?? GAME_CONFIG.DEFAULT_TIME_PER_QUESTION;
  const totalLives =
    data.meta.totalLives ?? GAME_CONFIG.DEFAULT_LIVES;

  const questions = shuffle(
    data.questions.map((q) => ({
      ...q,
      points: q.points ?? GAME_CONFIG.DEFAULT_POINTS_PER_QUESTION,
      timePerQuestion: q.timePerQuestion ?? timePerQuestion,
    }))
  );

  return {
    meta: { ...data.meta, timePerQuestion, totalLives },
    questions,
  };
}
