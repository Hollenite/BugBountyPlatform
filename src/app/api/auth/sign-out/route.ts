import { NextRequest, NextResponse } from "next/server"
import { authErrorResponse, clearSessionCookie, signOutRequest } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    await signOutRequest(req)
    const response = NextResponse.json({ ok: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    return authErrorResponse(error)
  }
}
