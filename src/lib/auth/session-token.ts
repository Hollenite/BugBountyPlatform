import crypto from "crypto"

type SessionTokenPayload = {
  sessionId: string
  userId: string
  expiresAt: Date
}

type EncodedSessionTokenPayload = {
  sessionId: string
  userId: string
  expiresAt: string
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url")
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function signSessionToken(payload: SessionTokenPayload, secret: string) {
  if (!secret) throw new Error("Session secret is required")

  const encodedPayload = encodeBase64Url(JSON.stringify({
    sessionId: payload.sessionId,
    userId: payload.userId,
    expiresAt: payload.expiresAt.toISOString(),
  } satisfies EncodedSessionTokenPayload))
  const signature = sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionTokenPayload> {
  if (!secret) throw new Error("Session secret is required")

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) throw new Error("Invalid session token")

  const expectedSignature = sign(encodedPayload, secret)
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid session token")
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as EncodedSessionTokenPayload
  const expiresAt = new Date(payload.expiresAt)
  if (!payload.sessionId || !payload.userId || Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid session token")
  }

  if (expiresAt.getTime() <= Date.now()) {
    throw new Error("Session token expired")
  }

  return {
    sessionId: payload.sessionId,
    userId: payload.userId,
    expiresAt,
  }
}
