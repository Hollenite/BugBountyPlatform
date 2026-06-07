import { NextRequest, NextResponse } from "next/server"
import { authErrorResponse, requireCurrentUserFromRequest } from "@/lib/auth/session"
import { buildWalletLinkMessage, createWalletNonce } from "@/lib/auth/wallet"
import { prisma } from "@/lib/db"

function getOrigin(req: NextRequest) {
  return req.headers.get("origin") ?? new URL(req.url).origin
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(req)
    const nonce = createWalletNonce()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const origin = getOrigin(req)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletNonce: nonce,
        walletNonceExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      nonce,
      expiresAt,
      message: buildWalletLinkMessage({ nonce, origin }),
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
