import { NextResponse } from "next/server";

export async function GET() {
  const oidcProvider = process.env.OIDC_PROVIDER || "";
  return NextResponse.json({
    hasOidc: Boolean(oidcProvider),
    oidcProvider,
  });
}
