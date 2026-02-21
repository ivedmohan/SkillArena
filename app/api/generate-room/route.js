import { NextResponse } from "next/server";
import { createRoom } from "../../../lib/firestoreHelpers";

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(request) {
  try {
    const { hostId, questionSetId = "default" } = await request.json();

    if (!hostId) {
      return NextResponse.json({ error: "hostId is required" }, { status: 400 });
    }

    const roomId = generateRoomId();
    await createRoom(roomId, hostId, questionSetId);

    return NextResponse.json({ roomId });
  } catch (err) {
    console.error("generate-room error:", err);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
