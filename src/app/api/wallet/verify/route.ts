import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authErrorResponse, requireCurrentUserFromRequest } from "@/lib/auth/session"
import { verifyWalletSignature } from "@/lib/auth/wallet"
import { prisma } from "@/lib/db"

const VerifyWalletSchema = z.object({
  signature: z.string().min(10),
})

function getOrigin(req: NextRequest) {
  return req.headers.get("origin") ?? new URL(req.url).origin
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(req)
    const parsed = VerifyWalletSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    if (!user.walletNonce || !user.walletNonceExpiresAt || user.walletNonceExpiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Wallet link nonce expired or missing" }, { status: 422 })
    }

    const result = verifyWalletSignature({
      expectedNonce: user.walletNonce,
      origin: getOrigin(req),
      signature: parsed.data.signature,
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        wallet: result.address,
        walletVerifiedAt: new Date(),
        walletNonce: null,
        walletNonceExpiresAt: null,
      },
    })

    return NextResponse.json({
      wallet: updated.wallet,
      walletVerifiedAt: updated.walletVerifiedAt,
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
