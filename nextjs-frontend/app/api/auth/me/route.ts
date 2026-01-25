import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/app/lib/db";

export async function GET() {
  try {
    // 1. Read session_id cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. Query session from database
    const session = db.prepare(`
      SELECT id, user_id, expires_at, last_seen_at
      FROM sessions
      WHERE id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 3. Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (expiresAt < now) {
      // Delete expired session
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 4. Query user from database
    const user = db.prepare(`
      SELECT id, username, enabled, is_admin
      FROM users
      WHERE id = ?
    `).get(session.user_id) as any;

    if (!user) {
      // User deleted - remove orphaned session
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 5. Check if user is enabled
    if (!user.enabled) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 6. Update lastSeenAt
    db.prepare(`
      UPDATE sessions 
      SET last_seen_at = ? 
      WHERE id = ?
    `).run(now.toISOString(), sessionId);

    // 7. Return identity context
    return NextResponse.json({
      userId: user.id,
      username: user.username,
      isAdmin: Boolean(user.is_admin)
    });

  } catch (error: any) {
    console.error("Auth/me error:", error);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
