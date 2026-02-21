import { NextResponse } from "next/server";
import { getRoom, getQuestionSetMeta } from "../../../lib/firestoreHelpers";
import { calcPoints, calcTimeBonus, getComboMultiplier } from "../../../engine/gameEngine";
import { GAME_CONFIG } from "../../../constants/gameConfig";

/**
 * POST /api/validate
 * Server-side answer validation — prevents client-side score manipulation.
 *
 * Body: { playerId, roomId, questionId, answer, timeTaken, currentStreak }
 * Returns: { correct: bool, points: number, explanation: string }
 */
export async function POST(request) {
  try {
    const { playerId, roomId, questionId, answer, timeTaken = 15, currentStreak = 1 } =
      await request.json();

    if (!roomId || !questionId || answer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // load the question set for this room
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Fetch question set JSON from public or storage URL
    // For the default set, load from the known public path
    const questionSetUrl =
      room.questionSetId === "default"
        ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/questions/sample.json`
        : room.storageUrl;

    const res = await fetch(questionSetUrl);
    if (!res.ok) throw new Error("Could not fetch question set");
    const data = await res.json();

    const question = data.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const correct = answer === question.answer;
    let points = 0;

    if (correct) {
      points = calcPoints(
        question.points ?? GAME_CONFIG.DEFAULT_POINTS_PER_QUESTION,
        timeTaken,
        currentStreak
      );
    }

    return NextResponse.json({
      correct,
      points,
      explanation: question.explanation,
      correctAnswer: correct ? null : question.answer, // only reveal if wrong
    });
  } catch (err) {
    console.error("validate error:", err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
