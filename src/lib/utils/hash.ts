import crypto from "crypto"
import stableStringify from "json-stable-stringify"
import { ethers } from "ethers"

export function deterministicHash(obj: unknown): string {
  const str = stableStringify(obj) ?? ""
  return crypto.createHash("sha256").update(str).digest("hex")
}

export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex")
}

export function keccakStable(obj: unknown): string {
  const str = stableStringify(obj) ?? ""
  return ethers.keccak256(ethers.toUtf8Bytes(str))
}
