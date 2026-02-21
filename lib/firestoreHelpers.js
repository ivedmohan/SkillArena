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
} from "firebase/firestore";
import { getDb } from "./firebase";

// ─── Room ────────────────────────────────────────────────────────────────────

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

// ─── Player ──────────────────────────────────────────────────────────────────

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

// ─── Real-time leaderboard ────────────────────────────────────────────────────

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

/**
 * Saves the full question set JSON into Firestore.
 * No Firebase Storage needed — Firestore documents support up to 1MB.
 */
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

/**
 * Fetches a full question set (meta + questions) from Firestore.
 */
export async function getQuestionSetFromFirestore(setId) {
  const snap = await getDoc(doc(getDb(), "questionSets", setId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { meta: d.meta, questions: d.questions };
}
