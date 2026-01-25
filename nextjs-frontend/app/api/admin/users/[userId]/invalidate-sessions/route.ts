
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

// POST /api/admin/users/[userId]/invalidate-sessions - Invalidate all sessions for a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const result = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

    return NextResponse.json({ 
      message: `Invalidated ${result.changes} sessions for user` 
    });
  } catch (error: any) {
    console.error("Error invalidating user sessions:", error);
    return NextResponse.json(
      { error: "Failed to invalidate sessions" },
      { status: 500 }
    );
  }
}
