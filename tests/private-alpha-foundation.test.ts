import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { Wallet } from "ethers"
import { assertUserRole, isRole } from "../src/lib/auth/roles"
import { buildWalletLinkMessage, verifyWalletSignature } from "../src/lib/auth/wallet"
import { hashSessionToken, signSessionToken, verifySessionToken } from "../src/lib/auth/session-token"
import { parseProgramConfig } from "../src/lib/programs/config"

describe("private alpha auth foundation", () => {
  it("accepts only known role strings", () => {
    assert.equal(isRole("researcher"), true)
    assert.equal(isRole("company"), true)
    assert.equal(isRole("verifier"), true)
    assert.equal(isRole("admin"), false)
  })

  it("enforces allowed roles with status-coded authorization errors", () => {
    const user = { id: "user-1", role: "researcher" }

    assert.equal(assertUserRole(user, "researcher").id, "user-1")
    assert.throws(
      () => assertUserRole(user, "verifier"),
      (error) => error instanceof Error && "status" in error && error.status === 403,
    )
  })

  it("signs and verifies tamper-resistant app session tokens", async () => {
    const secret = "private-alpha-test-secret"
    const expiresAt = new Date("2030-01-01T00:00:00.000Z")
    const token = await signSessionToken({ sessionId: "session-1", userId: "user-1", expiresAt }, secret)
    const verified = await verifySessionToken(token, secret)

    assert.deepEqual(verified, {
      sessionId: "session-1",
      userId: "user-1",
      expiresAt,
    })
    assert.notEqual(hashSessionToken(token), token)
    await assert.rejects(() => verifySessionToken(`${token.slice(0, -1)}x`, secret), /Invalid session token/)
  })

  it("verifies a MetaMask signature against the authenticated wallet nonce", async () => {
    const wallet = Wallet.createRandom()
    const nonce = "fb_nonce_test_123"
    const message = buildWalletLinkMessage({ nonce, origin: "https://alpha.failbounty.local" })
    const signature = await wallet.signMessage(message)

    const result = verifyWalletSignature({
      expectedNonce: nonce,
      origin: "https://alpha.failbounty.local",
      signature,
    })

    assert.equal(result.address, wallet.address)
    assert.equal(result.message, message)
  })
})

describe("private alpha program configuration", () => {
  it("normalizes hosted sandbox program configuration", () => {
    const config = parseProgramConfig({
      targetTemplateId: "refund-agent",
      visibility: "private",
      scope: {
        allowedCategories: ["overspend", "no_approval"],
        blockedTargets: ["external_api"],
      },
      policy: {
        maxRefundUsd: 50,
        requiresConfirmedViolation: true,
      },
      reward: {
        display: "Symbolic testnet reward only",
      },
    })

    assert.equal(config.targetTemplateId, "refund-agent")
    assert.equal(config.visibility, "private")
    assert.deepEqual(config.scope.allowedCategories, ["overspend", "no_approval"])
    assert.equal(config.policy.requiresConfirmedViolation, true)
  })

  it("rejects arbitrary external target templates for alpha", () => {
    assert.throws(
      () => parseProgramConfig({ targetTemplateId: "external-api", visibility: "private" }),
      /Unsupported hosted sandbox template/,
    )
  })
}
)
