
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import { validateAdminRequest } from "@/app/lib/guard";

// GET /api/admin/users - List all users
export async function GET() {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const stmt = db.prepare(`
      SELECT id, username, email, enabled, is_admin, created_at as createdAt, updated_at as updatedAt, password_updated_at as passwordUpdatedAt 
      FROM users
    `);
    const users = stmt.all();
    
    // Boolean conversion (sqlite stores boolean as 0/1)
    const formattedUsers = users.map((u: any) => ({
      ...u,
      enabled: Boolean(u.enabled),
      isAdmin: Boolean(u.is_admin)
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch users", code: "DB_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(req: NextRequest) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { username, password, email, enabled } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const isEnabled = enabled !== false ? 1 : 0; // Default to true if not provided
    const isAdministrator = 0; // Always false for API creation

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, enabled, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, username, email || null, passwordHash, isEnabled, isAdministrator);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json(
          { error: "Username already exists", code: "DUPLICATE_USER" },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      id,
      username,
      enabled: Boolean(isEnabled),
      isAdmin: Boolean(isAdministrator),
      createdAt: new Date().toISOString() // Approximate since we rely on DB default, but for response created now is fine
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
