import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { attachSessionCookie, authErrorResponse, signInExistingUserByEmail } from "@/lib/auth/session"

const SignInSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = SignInSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { user, session } = await signInExistingUserByEmail(parsed.data.email)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        wallet: user.wallet,
      },
    })

    attachSessionCookie(response, session)
    return response
  } catch (error) {
    return authErrorResponse(error)
  }
}
