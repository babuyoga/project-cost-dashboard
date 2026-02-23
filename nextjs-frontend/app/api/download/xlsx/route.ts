import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/api/config";

export async function POST(request: NextRequest) {
  console.log("[Route /api/download/xlsx] POST request");
  console.log("  Backend URL:", BACKEND_URL);

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/download/xlsx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}`);
      return NextResponse.json(
        { error: `Backend failed with status ${res.status}` },
        { status: res.status },
      );
    }

    // Stream the binary xlsx back to the browser with the original headers
    const arrayBuffer = await res.arrayBuffer();
    console.log(`  Received ${arrayBuffer.byteLength} bytes from backend`);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="cost_breakdown.xlsx"',
      },
    });
  } catch (error) {
    console.error(
      `  Backend unreachable (${BACKEND_URL}) or other error:`,
      error,
    );
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 },
    );
  }
}
