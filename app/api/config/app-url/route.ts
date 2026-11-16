import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.APP_URL || "";
  return NextResponse.json({ appUrl });
}
