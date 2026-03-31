import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getDb } from "./firebase";

// ─── Room (legacy multiplayer) ─────────────────────────────────────────────

export async function createRoom(roomId, hostId, questionSetId) {
  await setDoc(doc(getDb(), "rooms", roomId), {
    createdAt: serverTimestamp(),
    questionSetId,
    status: "waiting",
    currentQuestion: 0,
    hostId,
  });
}

export async function getRoom(roomId) {
  const snap = await getDoc(doc(getDb(), "rooms", roomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateRoomStatus(roomId, status) {
  await updateDoc(doc(getDb(), "rooms", roomId), { status });
}

export function subscribeToRoom(roomId, callback) {
  return onSnapshot(doc(getDb(), "rooms", roomId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function updateCurrentQuestion(roomId, index) {
  await updateDoc(doc(getDb(), "rooms", roomId), { currentQuestion: index });
}

export async function joinRoom(roomId, playerId, name) {
  await setDoc(doc(getDb(), "rooms", roomId, "players", playerId), {
    name,
    score: 0,
    lives: 3,
    combo: 1,
    answeredQuestions: [],
    weakTopics: {},
    joinedAt: serverTimestamp(),
  });
}

export async function updatePlayerState(roomId, playerId, updates) {
  await updateDoc(doc(getDb(), "rooms", roomId, "players", playerId), updates);
}

export async function getPlayer(roomId, playerId) {
  const snap = await getDoc(doc(getDb(), "rooms", roomId, "players", playerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeToLeaderboard(roomId, callback) {
  const q = query(
    collection(getDb(), "rooms", roomId, "players"),
    orderBy("score", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(players);
  });
}

// ─── Question Sets ────────────────────────────────────────────────────────────

export async function saveQuestionSetWithData(setId, data) {
  await setDoc(doc(getDb(), "questionSets", setId), {
    title: data.meta.title,
    category: data.meta.category,
    difficulty: data.meta.difficulty,
    version: data.meta.version,
    questionCount: data.questions.length,
    meta: data.meta,
    questions: data.questions,
    uploadedAt: serverTimestamp(),
  });
}

export async function getQuestionSetFromFirestore(setId) {
  const snap = await getDoc(doc(getDb(), "questionSets", setId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { meta: d.meta, questions: d.questions };
}

// ─── Plugin Leaderboard (/leaderboard/{gameId}/scores) ───────────────────────

/**
 * Submit a final score to the global leaderboard.
 * Returns { rank, totalPlayers }.
 */
export async function submitScore({ playerName, gameId, score, timeTaken, difficulty }) {
  const scoreId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(getDb(), "leaderboard", gameId, "scores", scoreId), {
    playerName,
    score,
    timeTaken: timeTaken ?? 0,
    gameId,
    difficulty: difficulty ?? "medium",
    createdAt: serverTimestamp(),
  });
  return { scoreId };
}

/**
 * Fetch top N scores for a game (one-time read).
 */
export async function getTopScores(gameId, limitCount = 10) {
  const q = query(
    collection(getDb(), "leaderboard", gameId, "scores"),
    orderBy("score", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to top scores for a game.
 */
export function subscribeToGameLeaderboard(gameId, callback, limitCount = 10) {
  const q = query(
    collection(getDb(), "leaderboard", gameId, "scores"),
    orderBy("score", "desc"),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(scores);
  });
}

// ─── Game Config Upload (admin) ───────────────────────────────────────────────

export async function saveGameConfig(gameId, configData) {
  await setDoc(doc(getDb(), "gameConfigs", gameId), {
    ...configData,
    uploadedAt: serverTimestamp(),
  });
}

export async function getGameConfig(gameId) {
  const snap = await getDoc(doc(getDb(), "gameConfigs", gameId));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Fetch top recent community generated games.
 */
export async function getCommunityGames(limitCount = 10) {
  const q = query(
    collection(getDb(), "gameConfigs"),
    orderBy("uploadedAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ dbId: d.id, ...d.data() }));
}
