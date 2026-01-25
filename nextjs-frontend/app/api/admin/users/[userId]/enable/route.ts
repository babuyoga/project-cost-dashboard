
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

// POST /api/admin/users/[userId]/enable
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const stmt = db.prepare(`
      UPDATE users 
      SET enabled = 1, updated_at = datetime('now') 
      WHERE id = ?
    `);

    const info = stmt.run(userId);

    if (info.changes === 0) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
        id: userId,
        enabled: true
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to enable user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
