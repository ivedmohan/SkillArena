"use client";

/**
 * AnalyticsChart — horizontal bar chart showing weak topics.
 * Pure CSS bars (no external dependency needed for this).
 *
 * Props:
 *   weakTopics  { [topic]: wrongCount }
 */
export default function AnalyticsChart({ weakTopics }) {
  if (!weakTopics || Object.keys(weakTopics).length === 0) {
    return (
      <div className="text-center text-[#8888aa] text-sm py-4">
        No weak areas detected. Great job! 🎉
      </div>
    );
  }

  const entries = Object.entries(weakTopics).sort(([, a], [, b]) => b - a);
  const max = entries[0][1];

  return (
    <div className="w-full">
      <h3 className="text-xs uppercase tracking-widest text-[#8888aa] mb-4 font-semibold">
        Weak Areas
      </h3>
      <ul className="flex flex-col gap-3">
        {entries.map(([topic, count]) => {
          const pct = Math.round((count / max) * 100);
          return (
            <li key={topic} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#f0f0f0] font-medium">{topic}</span>
                <span className="text-[#ff0099] font-bold tabular-nums">
                  {count} wrong
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ff0099] transition-all duration-700"
                  style={{ width: `${pct}%`, boxShadow: "0 0 6px #ff009966" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
