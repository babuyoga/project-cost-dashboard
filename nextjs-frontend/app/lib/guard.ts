import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function validateAdminRequest() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query session and user info
    // Join users to get is_admin status directly
    const session = db.prepare(`
      SELECT s.id, s.expires_at, u.is_admin, u.enabled
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < now) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check enabled
    if (!session.enabled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin
    if (!session.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Update last seen
    db.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(now.toISOString(), sessionId);

    return null; // Return null if authorized
  } catch (error) {
    console.error("Admin validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
