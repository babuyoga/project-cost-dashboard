
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

import { validateAdminRequest } from "@/app/lib/guard";

// GET /api/admin/users/[userId] - Get a single user
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { userId } = await params;
    const stmt = db.prepare(`
      SELECT id, username, email, enabled, is_admin as isAdmin, created_at as createdAt, updated_at as updatedAt, password_updated_at as passwordUpdatedAt 
      FROM users WHERE id = ?
    `);
    
    const user = stmt.get(userId) as any;

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
        ...user,
        enabled: Boolean(user.enabled),
        isAdmin: Boolean(user.isAdmin)
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch user", code: "DB_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId] - Update user (username, enabled)
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { userId } = await params;
    const body = await req.json();
    const { username, email, enabled, isAdmin } = body;

    if (!username && email === undefined && enabled === undefined && isAdmin === undefined) {
      return NextResponse.json(
        { error: "At least one field (username, email, enabled, isAdmin) is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Build query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (enabled !== undefined) {
      updates.push("enabled = ?");
      values.push(enabled ? 1 : 0);
    }
    if (isAdmin !== undefined) {
      updates.push("is_admin = ?");
      values.push(isAdmin ? 1 : 0);
    }

    // Always update timestamp
    updates.push("updated_at = datetime('now')");

    values.push(userId); // For WHERE clause

    const stmt = db.prepare(`
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = ?
    `);

    try {
      const info = stmt.run(...values);

      if (info.changes === 0) {
        return NextResponse.json(
          { error: "User not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
    } catch (err: any) {
       if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json(
          { error: "Username already exists", code: "DUPLICATE_USER" },
          { status: 409 }
        );
      }
      throw err;
    }

    // Return updated record
    const user = db.prepare(`
        SELECT id, username, enabled, is_admin as isAdmin, updated_at as updatedAt 
        FROM users WHERE id = ?
    `).get(userId) as any;

    return NextResponse.json({
         ...user,
         enabled: Boolean(user.enabled),
         isAdmin: Boolean(user.isAdmin)
    });

  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const unauthorized = await validateAdminRequest();
  if (unauthorized) return unauthorized;

  try {
     const { userId } = await params;
     
     // Due to ON DELETE CASCADE on sessions table, this will also remove sessions
     const stmt = db.prepare("DELETE FROM users WHERE id = ?");
     const info = stmt.run(userId);

     if (info.changes === 0) {
        return NextResponse.json(
          { error: "User not found", code: "NOT_FOUND" },
          { status: 404 }
        );
     }

     return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
