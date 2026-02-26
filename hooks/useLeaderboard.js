"use client";
import { useState, useEffect } from "react";
import { subscribeToGameLeaderboard } from "../lib/firestoreHelpers";

/**
 * Real-time leaderboard hook for the plugin engine.
 * Subscribes to /leaderboard/{gameId}/scores ordered by score desc.
 */
export function useLeaderboard(gameId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGameLeaderboard(gameId, (data) => {
      setPlayers(data);
      setLoading(false);
    });
    return unsub;
  }, [gameId]);

  return { players, loading };
}
