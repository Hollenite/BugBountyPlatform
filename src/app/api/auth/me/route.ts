import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth/session"

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wallet: user.wallet,
    },
  })
}
