import { NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { prisma } from "@/lib/db"
import { ChainRecordSchema } from "@/lib/validation"
import { authErrorResponse, requireRoleFromRequest } from "@/lib/auth/session"
import { getProofRegistryAddress, MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_RPC_URL } from "@/lib/chain/monad"
import { buildProofRecord, findProofSubmittedEvent, validateProofSubmittedEvent } from "@/lib/chain/proofRegistry"

export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } },
) {
  try {
    await requireRoleFromRequest(req, "verifier")

    const body = await req.json()
    const parsed = ChainRecordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    if (parsed.data.payoutTx) {
      return NextResponse.json({ error: "Payout transaction recording is not implemented yet" }, { status: 422 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        program: true,
        researcher: { select: { wallet: true } },
      },
    })

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (submission.status !== "accepted") {
      return NextResponse.json({ error: "Can only record chain state for accepted submissions" }, { status: 422 })
    }
    if (submission.replayResult !== "reproduced_exact") {
      return NextResponse.json({ error: "On-chain proof requires an exact verifier rerun" }, { status: 422 })
    }
    if (submission.chainFindingId !== null) {
      return NextResponse.json({ error: "On-chain proof already recorded" }, { status: 409 })
    }
    if (submission.program.chainProgramIndex === null) {
      return NextResponse.json({ error: "Program is not configured on Monad testnet" }, { status: 422 })
    }
    if (!submission.reportHash || !submission.evidenceHash) {
      return NextResponse.json({ error: "Submission is missing proof hashes" }, { status: 422 })
    }

    const researcherWallet = submission.researcherWallet ?? submission.researcher.wallet
    if (!researcherWallet) {
      return NextResponse.json({ error: "Submission is missing researcher wallet metadata" }, { status: 422 })
    }

    const contractAddress = getProofRegistryAddress()
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return NextResponse.json({ error: "FailBounty proof registry contract is not configured" }, { status: 503 })
    }

    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC_URL, MONAD_TESTNET_CHAIN_ID)
    const receipt = await provider.getTransactionReceipt(parsed.data.submitFindingTx)
    if (!receipt) return NextResponse.json({ error: "Monad transaction receipt not found" }, { status: 404 })
    if (receipt.status !== 1) return NextResponse.json({ error: "Monad transaction did not succeed" }, { status: 422 })

    const contractLogs = receipt.logs.filter((log) => log.address.toLowerCase() === contractAddress.toLowerCase())
    const proofEvent = findProofSubmittedEvent(contractLogs)
    if (!proofEvent) return NextResponse.json({ error: "ProofSubmitted event not found in transaction receipt" }, { status: 422 })

    const proofRecord = buildProofRecord({
      submissionId: submission.id,
      chainProgramIndex: submission.program.chainProgramIndex,
      reportHash: submission.reportHash,
      evidenceHash: submission.evidenceHash,
      researcherWallet,
    })
    const chainFindingId = validateProofSubmittedEvent({ expected: proofRecord, event: proofEvent })

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        chainFindingId,
        submitFindingTx: receipt.hash,
        payoutTx: null,
      },
    })

    return NextResponse.json({
      submissionId: updated.id,
      chainFindingId: updated.chainFindingId,
      submitFindingTx: updated.submitFindingTx,
      payoutTx: updated.payoutTx,
      onChainStatus: "recorded",
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
