import crypto from "crypto"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { AuthError, UserRole, assertUserRole } from "@/lib/auth/roles"
import { hashSessionToken, signSessionToken, verifySessionToken } from "@/lib/auth/session-token"

export const SESSION_COOKIE_NAME = "failbounty_session"
const SESSION_TTL_DAYS = 14

function getSessionSecret() {
  const secret = process.env.FAILBOUNTY_SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== "production") return "failbounty-local-development-session-secret"
  throw new Error("FAILBOUNTY_SESSION_SECRET is required in production")
}

function getSessionExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)
  return expiresAt
}

function createOpaqueSessionId() {
  return crypto.randomUUID()
}

export async function createAppSession(userId: string) {
  const expiresAt = getSessionExpiry()
  const sessionId = createOpaqueSessionId()
  const token = await signSessionToken({ sessionId, userId, expiresAt }, getSessionSecret())

  await prisma.appSession.create({
    data: {
      id: sessionId,
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export function attachSessionCookie(response: NextResponse, session: { token: string; expiresAt: Date }) {
  response.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })
}

async function getUserForToken(token: string | undefined) {
  if (!token) return null

  let verified: Awaited<ReturnType<typeof verifySessionToken>>
  try {
    verified = await verifySessionToken(token, getSessionSecret())
  } catch {
    return null
  }

  const appSession = await prisma.appSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  })

  if (!appSession || appSession.id !== verified.sessionId || appSession.userId !== verified.userId) {
    return null
  }

  if (appSession.expiresAt.getTime() <= Date.now()) {
    await prisma.appSession.delete({ where: { id: appSession.id } }).catch(() => null)
    return null
  }

  return appSession.user
}

export async function getCurrentUserFromRequest(req: NextRequest) {
  return getUserForToken(req.cookies.get(SESSION_COOKIE_NAME)?.value)
}

export async function getCurrentUserFromCookies() {
  return getUserForToken(cookies().get(SESSION_COOKIE_NAME)?.value)
}

export async function requireCurrentUserFromRequest(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) throw new AuthError("Authentication required", 401)
  return user
}

export async function requireRoleFromRequest(req: NextRequest, role: UserRole | UserRole[]) {
  const user = await requireCurrentUserFromRequest(req)
  return assertUserRole(user, role)
}

export async function signInExistingUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) throw new AuthError("No private alpha account found for that email", 404)

  const session = await createAppSession(user.id)
  return { user, session }
}

export async function signOutRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return

  await prisma.appSession.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => null)
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  throw error
}
