"use client";
import { useState, useEffect } from "react";
import { subscribeToLeaderboard } from "../lib/firestoreHelpers";

/**
 * Real-time leaderboard hook.
 * Subscribes to Firestore onSnapshot for the given room.
 */
export function useLeaderboard(roomId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToLeaderboard(roomId, (data) => {
      setPlayers(data);
      setLoading(false);
    });
    return unsub;
  }, [roomId]);

  return { players, loading };
}
