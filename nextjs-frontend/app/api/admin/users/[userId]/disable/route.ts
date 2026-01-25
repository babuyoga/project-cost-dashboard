
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

import { validateAdminRequest } from "@/app/lib/guard";

// POST /api/admin/users/[userId]/disable
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { userId } = await params;

    const stmt = db.prepare(`
      UPDATE users 
      SET enabled = 0, updated_at = datetime('now') 
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
        enabled: false
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to disable user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
