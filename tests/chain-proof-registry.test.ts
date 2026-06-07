import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { Interface } from "ethers"
import { FAILBOUNTY_PROOF_REGISTRY_ABI } from "../src/lib/chain/abi"
import {
  buildProofRecord,
  findProofSubmittedEvent,
  normalizeBytes32Hash,
  validateProofSubmittedEvent,
} from "../src/lib/chain/proofRegistry"

describe("Monad proof registry helpers", () => {
  it("normalizes report and evidence hashes into bytes32 hex values", () => {
    assert.equal(
      normalizeBytes32Hash("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    )
    assert.equal(
      normalizeBytes32Hash("0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"),
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    )
  })

  it("rejects invalid bytes32 values before contract calls", () => {
    assert.throws(() => normalizeBytes32Hash("abc"), /bytes32/)
    assert.throws(() => normalizeBytes32Hash("not-hex"), /bytes32/)
  })

  it("builds the exact proof record used for Monad anchoring", () => {
    const record = buildProofRecord({
      submissionId: "sub-123",
      chainProgramIndex: 7,
      reportHash: `0x${"1".repeat(64)}`,
      evidenceHash: "2".repeat(64),
      researcherWallet: "0x1111111111111111111111111111111111111111",
    })

    assert.deepEqual(record, {
      submissionId: "sub-123",
      chainProgramIndex: 7,
      reportHash: `0x${"1".repeat(64)}`,
      evidenceHash: `0x${"2".repeat(64)}`,
      researcherWallet: "0x1111111111111111111111111111111111111111",
    })
  })

  it("accepts only matching ProofSubmitted event data", () => {
    const expected = buildProofRecord({
      submissionId: "sub-123",
      chainProgramIndex: 7,
      reportHash: `0x${"1".repeat(64)}`,
      evidenceHash: "2".repeat(64),
      researcherWallet: "0x1111111111111111111111111111111111111111",
    })

    const chainFindingId = validateProofSubmittedEvent({
      expected,
      event: {
        findingId: 42n,
        programIndex: 7n,
        researcher: "0x1111111111111111111111111111111111111111",
        reportHash: `0x${"1".repeat(64)}`,
        evidenceHash: `0x${"2".repeat(64)}`,
        submissionId: "sub-123",
      },
    })

    assert.equal(chainFindingId, 42)
  })

  it("rejects proof events for a different report hash", () => {
    const expected = buildProofRecord({
      submissionId: "sub-123",
      chainProgramIndex: 7,
      reportHash: `0x${"1".repeat(64)}`,
      evidenceHash: "2".repeat(64),
      researcherWallet: "0x1111111111111111111111111111111111111111",
    })

    assert.throws(
      () =>
        validateProofSubmittedEvent({
          expected,
          event: {
            findingId: 42n,
            programIndex: 7n,
            researcher: "0x1111111111111111111111111111111111111111",
            reportHash: `0x${"3".repeat(64)}`,
            evidenceHash: `0x${"2".repeat(64)}`,
            submissionId: "sub-123",
          },
        }),
      /report hash/i,
    )
  })

  it("parses ProofSubmitted from transaction receipt logs", () => {
    const iface = new Interface(FAILBOUNTY_PROOF_REGISTRY_ABI)
    const event = iface.encodeEventLog(iface.getEvent("ProofSubmitted")!, [
      42n,
      7n,
      "0x1111111111111111111111111111111111111111",
      `0x${"1".repeat(64)}`,
      `0x${"2".repeat(64)}`,
      "sub-123",
    ])

    const parsed = findProofSubmittedEvent([
      {
        address: "0x2222222222222222222222222222222222222222",
        topics: event.topics,
        data: event.data,
      },
    ])

    assert.deepEqual(parsed, {
      findingId: 42n,
      programIndex: 7n,
      researcher: "0x1111111111111111111111111111111111111111",
      reportHash: `0x${"1".repeat(64)}`,
      evidenceHash: `0x${"2".repeat(64)}`,
      submissionId: "sub-123",
    })
  })
})
