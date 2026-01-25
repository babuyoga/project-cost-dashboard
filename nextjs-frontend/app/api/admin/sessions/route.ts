
import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// GET /api/admin/sessions - List all sessions
export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT 
        s.id, 
        s.user_id as userId, 
        s.expires_at as expiresAt, 
        s.created_at as createdAt, 
        s.last_seen_at as lastSeenAt,
        u.username
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    const sessions = stmt.all();

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
