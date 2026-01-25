
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// POST /api/admin/password-hash - Generate bcrypt hash
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    return NextResponse.json({ hash });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate hash", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
