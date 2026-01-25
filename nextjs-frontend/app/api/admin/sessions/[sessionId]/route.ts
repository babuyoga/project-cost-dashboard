
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

import { validateAdminRequest } from "@/app/lib/guard";

// DELETE /api/admin/sessions/[sessionId] - Invalidate a specific session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { sessionId } = await params;

    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Session invalidated successfully" });
  } catch (error: any) {
    console.error("Error invalidating session:", error);
    return NextResponse.json(
      { error: "Failed to invalidate session" },
      { status: 500 }
    );
  }
}
