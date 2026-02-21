"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Countdown timer hook.
 *
 * @param {number} duration   - total seconds to count down
 * @param {Function} onExpire - called when timer reaches 0
 * @param {boolean} active    - start/pause the timer
 */
export function useTimer(duration, onExpire, active = true) {
  const [remaining, setRemaining] = useState(duration);
  const onExpireRef = useRef(onExpire);
  const intervalRef = useRef(null);

  // keep callback ref fresh without restarting the timer
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // reset when duration changes (new question)
  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, duration]);

  const reset = useCallback(() => setRemaining(duration), [duration]);

  const progress = duration > 0 ? remaining / duration : 0; // 1 → 0

  return { remaining, progress, reset };
}
