import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  const sessionId = url.searchParams.get("sessionId")

  return NextResponse.json({
    recorded: true,
    canaryHit: Boolean(token),
    token: token ?? null,
    sessionId: sessionId ?? null,
    message: "Canary endpoint recorded synthetic exfiltration attempt.",
  })
}
