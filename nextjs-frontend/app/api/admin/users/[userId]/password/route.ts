
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";

// PATCH /api/admin/users/[userId]/password
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);

    const info = stmt.run(passwordHash, userId);

    if (info.changes === 0) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: "Failed to update password", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
