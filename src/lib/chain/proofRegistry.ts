import { ethers } from "ethers"
import { FAILBOUNTY_PROOF_REGISTRY_ABI } from "./abi"

export type ProofRecord = {
  submissionId: string
  chainProgramIndex: number
  reportHash: string
  evidenceHash: string
  researcherWallet: string
}

export type ProofSubmittedEvent = {
  findingId: bigint
  programIndex: bigint
  researcher: string
  reportHash: string
  evidenceHash: string
  submissionId: string
}

type ReceiptLog = {
  address: string
  topics: readonly string[]
  data: string
}

const proofRegistryInterface = new ethers.Interface(FAILBOUNTY_PROOF_REGISTRY_ABI)

const BYTES32_HEX = /^(0x)?[0-9a-fA-F]{64}$/

export function normalizeBytes32Hash(value: string) {
  if (!BYTES32_HEX.test(value)) {
    throw new Error("Expected a bytes32 hex value")
  }

  return (value.startsWith("0x") ? value : `0x${value}`).toLowerCase()
}

export function buildProofRecord(input: {
  submissionId: string
  chainProgramIndex: number
  reportHash: string
  evidenceHash: string
  researcherWallet: string
}): ProofRecord {
  if (!Number.isInteger(input.chainProgramIndex) || input.chainProgramIndex < 0) {
    throw new Error("Expected a non-negative chain program index")
  }
  if (!ethers.isAddress(input.researcherWallet)) {
    throw new Error("Expected a valid researcher wallet address")
  }

  return {
    submissionId: input.submissionId,
    chainProgramIndex: input.chainProgramIndex,
    reportHash: normalizeBytes32Hash(input.reportHash),
    evidenceHash: normalizeBytes32Hash(input.evidenceHash),
    researcherWallet: ethers.getAddress(input.researcherWallet),
  }
}

export function validateProofSubmittedEvent({
  expected,
  event,
}: {
  expected: ProofRecord
  event: ProofSubmittedEvent
}) {
  const findingId = Number(event.findingId)
  if (!Number.isSafeInteger(findingId) || findingId < 0) {
    throw new Error("Proof event finding id is not a safe integer")
  }

  if (event.programIndex !== BigInt(expected.chainProgramIndex)) {
    throw new Error("Proof event program index does not match submission program")
  }
  if (ethers.getAddress(event.researcher) !== expected.researcherWallet) {
    throw new Error("Proof event researcher wallet does not match submission")
  }
  if (normalizeBytes32Hash(event.reportHash) !== expected.reportHash) {
    throw new Error("Proof event report hash does not match submission")
  }
  if (normalizeBytes32Hash(event.evidenceHash) !== expected.evidenceHash) {
    throw new Error("Proof event evidence hash does not match submission")
  }
  if (event.submissionId !== expected.submissionId) {
    throw new Error("Proof event submission id does not match submission")
  }

  return findingId
}

export function findProofSubmittedEvent(logs: readonly ReceiptLog[]) {
  for (const log of logs) {
    try {
      const parsed = proofRegistryInterface.parseLog({ topics: [...log.topics], data: log.data })
      if (parsed?.name !== "ProofSubmitted") continue

      return {
        findingId: parsed.args.findingId as bigint,
        programIndex: parsed.args.programIndex as bigint,
        researcher: parsed.args.researcher as string,
        reportHash: parsed.args.reportHash as string,
        evidenceHash: parsed.args.evidenceHash as string,
        submissionId: parsed.args.submissionId as string,
      } satisfies ProofSubmittedEvent
    } catch {
      continue
    }
  }

  return null
}
