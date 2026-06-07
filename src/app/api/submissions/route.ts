import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { SubmitFindingSchema } from "@/lib/validation"
import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import { deterministicHash } from "@/lib/utils/hash"
import { authErrorResponse, requireRoleFromRequest } from "@/lib/auth/session"

export async function GET(req: NextRequest) {
  try {
    await requireRoleFromRequest(req, "verifier")

    const submissions = await prisma.submission.findMany({
      include: {
        program: {
          select: {
            name: true,
            rewardCriticalWei: true,
            rewardHighWei: true,
            rewardMediumWei: true,
            rewardLowWei: true,
          },
        },
        researcher: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleFromRequest(req, "researcher")
    const body = await req.json()
    const parsed = SubmitFindingSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const {
      sessionId,
      title,
      description,
      stepsToRepro,
      expectedBehavior,
      actualBehavior,
    } = parsed.data

    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: { events: { orderBy: { index: "asc" } } },
    })

    if (!session || session.actorId !== user.id) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 403 })
    }

    if (session.sessionType !== "researcher") {
      return NextResponse.json({ error: "Only researcher sessions can be submitted" }, { status: 400 })
    }

    if (session.status !== "active") {
      return NextResponse.json({ error: "Session is no longer active" }, { status: 400 })
    }

    const violationEvent = session.events.find((event) => event.type === "confirmed_violation")
    if (!violationEvent) {
      return NextResponse.json({ error: "Cannot submit: no confirmed violation event found in session" }, { status: 422 })
    }

    const existing = await prisma.submission.findUnique({ where: { sessionId } })
    if (existing) {
      return NextResponse.json({ error: "Submission already exists for this session" }, { status: 409 })
    }

    const violationPayload = JSON.parse(violationEvent.payload)
    const evidenceHash = deterministicHash({
      sessionId,
      events: session.events.map((event) => ({
        index: event.index,
        type: event.type,
        toolName: event.toolName,
        payload: JSON.parse(event.payload),
        flagged: event.flagged,
        createdAt: event.createdAt.toISOString(),
      })),
      confirmedViolation: violationPayload.violation,
      environmentSnapshot: session.environmentSnapshot ? JSON.parse(session.environmentSnapshot) : null,
      systemPromptHash: session.systemPromptHash,
      toolConfigHash: session.toolConfigHash,
    })

    const [, submission] = await prisma.$transaction([
      AgentSessionManager.markSessionSubmittedTx(prisma, sessionId),
      prisma.submission.create({
        data: {
          programId: session.programId,
          researcherId: user.id,
          sessionId,
          title,
          description,
          stepsToRepro,
          expectedBehavior,
          actualBehavior,
          researcherWallet: user.wallet,
          status: "pending",
          replayResult: "pending",
          evidenceHash,
        },
      }),
    ])

    return NextResponse.json({ ...submission, replayBundleReady: true }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Submission already exists for this session" }, { status: 409 })
    }
    return authErrorResponse(error)
  }
}
