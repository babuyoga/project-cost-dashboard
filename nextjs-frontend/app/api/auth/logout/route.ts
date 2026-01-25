import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/app/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (sessionId) {
      // Delete session from database
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }

    // Clear the cookie
    cookieStore.delete("session_id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
