import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { username, password } = body;

    // Sanitization
    username = username ? username.trim() : "";
    password = password ? password.trim() : "";

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length > 26 || password.length > 26) {
        return NextResponse.json(
            { error: "Username and password must be 26 characters or less" },
            { status: 400 }
        );
    }

    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = stmt.get(username) as any;

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!user.enabled) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Capture is_first_login status before updating it
    const isFirstLogin = Boolean(user.is_first_login);

    // Update is_first_login if it's true
    if (user.is_first_login) {
        db.prepare("UPDATE users SET is_first_login = 0 WHERE id = ?").run(user.id);
    }

    // Create session
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const insertSession = db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertSession.run(
      sessionId,
      user.id,
      expiresAt.toISOString(),
      now.toISOString(),
      now.toISOString()
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: Boolean(user.is_admin),
        isFirstLogin: isFirstLogin
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
