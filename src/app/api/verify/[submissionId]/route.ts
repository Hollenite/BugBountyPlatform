import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { VerifyActionSchema } from "@/lib/validation"
import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import { replaySession } from "@/lib/session/Replayer"
import { keccakStable, sha256 } from "@/lib/utils/hash"

export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } },
) {
  const body = await req.json()
  const parsed = VerifyActionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { action, severity, verifierId, verifierNote } = parsed.data

  // DEMO ROLE SIMULATION
  const verifier = await prisma.user.findUnique({ where: { id: verifierId } })
  if (!verifier || verifier.role !== "verifier") {
    return NextResponse.json({ error: "Only verifiers can take this action" }, { status: 403 })
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: { program: true },
  })

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (submission.status !== "pending" && action !== "replay") {
    return NextResponse.json({ error: "Only pending submissions can be resolved" }, { status: 422 })
  }

  if (action === "replay") {
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Cannot rerun replay after resolution" }, { status: 422 })
    }

    const bundle = await AgentSessionManager.buildReplayBundle(submission.sessionId)
    const result = await replaySession(bundle, submission.programId, verifierId)

    await prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        replayResult: result.replayStatus,
        replaySessionId: result.newSessionId,
        replayDetail: result.detail,
        replayComparison: JSON.stringify(result.comparison),
      },
    })

    return NextResponse.json(result)
  }

  if (action === "approve") {
    if (!severity) return NextResponse.json({ error: "severity required" }, { status: 400 })
    if (!verifierNote) return NextResponse.json({ error: "verifierNote required" }, { status: 400 })
    if (submission.replayResult !== "reproduced_exact") {
      return NextResponse.json({ error: `Cannot approve. Replay status is \"${submission.replayResult}\". Approval requires \"reproduced_exact\".` }, { status: 422 })
    }

    const rewardMap: Record<string, string> = {
      critical: submission.program.rewardCriticalWei,
      high: submission.program.rewardHighWei,
      medium: submission.program.rewardMediumWei,
      low: submission.program.rewardLowWei,
    }

    const payoutWei = rewardMap[severity]
    const reportHash = keccakStable({
      reportVersion: "failbounty-v1",
      programId: submission.programId,
      sessionId: submission.sessionId,
      evidenceHash: submission.evidenceHash,
      replayResult: submission.replayResult,
      replayComparison: submission.replayComparison ? JSON.parse(submission.replayComparison) : null,
      severity,
      verifierNoteHash: sha256(verifierNote),
    })

    const [updated] = await prisma.$transaction([
      prisma.submission.update({
        where: { id: params.submissionId },
        data: {
          status: "accepted",
          severity,
          payoutWei,
          reportHash,
          verifierNote,
          resolvedAt: new Date(),
        },
      }),
      AgentSessionManager.setSessionResolutionTx(prisma, submission.sessionId, "accepted"),
    ])

    return NextResponse.json({
      ...updated,
      offChainStatus: "accepted",
      onChainStatus: submission.chainFindingId === null ? "not_recorded" : "recorded",
    })
  }

  if (action === "reject") {
    if (!verifierNote) return NextResponse.json({ error: "verifierNote required" }, { status: 400 })

    const [updated] = await prisma.$transaction([
      prisma.submission.update({
        where: { id: params.submissionId },
        data: {
          status: "rejected",
          verifierNote,
          resolvedAt: new Date(),
        },
      }),
      AgentSessionManager.setSessionResolutionTx(prisma, submission.sessionId, "rejected"),
    ])

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
