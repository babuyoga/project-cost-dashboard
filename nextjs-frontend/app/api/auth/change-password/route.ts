import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get session and user
    const session = db.prepare(`
      SELECT user_id FROM sessions WHERE id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = db.prepare(`
      SELECT id, password_hash FROM users WHERE id = ?
    `).get(session.user_id) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now'), password_updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
