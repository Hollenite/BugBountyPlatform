import crypto from "crypto"
import { getAddress, verifyMessage } from "ethers"

export function createWalletNonce() {
  return `fb_${crypto.randomBytes(24).toString("hex")}`
}

export function buildWalletLinkMessage({
  nonce,
  origin,
}: {
  nonce: string
  origin: string
}) {
  return [
    "FailBounty wallet link",
    "",
    "Sign this message to attach your wallet as proof metadata.",
    `Origin: ${origin}`,
    `Nonce: ${nonce}`,
  ].join("\n")
}

export function verifyWalletSignature({
  expectedNonce,
  origin,
  signature,
}: {
  expectedNonce: string
  origin: string
  signature: string
}) {
  const message = buildWalletLinkMessage({ nonce: expectedNonce, origin })
  const address = getAddress(verifyMessage(message, signature))

  return { address, message }
}
