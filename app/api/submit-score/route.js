import { NextResponse } from "next/server";
import { submitScore } from "../../../lib/firestoreHelpers";

/**
 * POST /api/submit-score
 * Body: { playerName, gameId, score, timeTaken, difficulty }
 * Returns: { scoreId }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { playerName, gameId, score, timeTaken, difficulty } = body;

    if (!playerName || !gameId || score == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await submitScore({ playerName, gameId, score, timeTaken, difficulty });
    return NextResponse.json(result);
  } catch (err) {
    console.error("submit-score error:", err);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}
