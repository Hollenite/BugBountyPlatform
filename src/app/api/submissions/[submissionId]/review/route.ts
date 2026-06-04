import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { submissionId: string } },
) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      program: true,
      researcher: { select: { id: true, name: true, email: true, wallet: true } },
      session: true,
    },
  })

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const events = await prisma.traceEvent.findMany({
    where: { sessionId: submission.sessionId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json({
    submission,
    program: submission.program,
    researcher: submission.researcher,
    session: submission.session,
    events: events.map((event) => ({
      index: event.index,
      type: event.type,
      toolName: event.toolName,
      payload: JSON.parse(event.payload),
      flagged: event.flagged,
      createdAt: event.createdAt,
    })),
    replayBundleMetadata: {
      modelId: submission.session.modelId,
      modelParams: submission.session.modelParams ? JSON.parse(submission.session.modelParams) : null,
      systemPromptHash: submission.session.systemPromptHash,
      toolConfigHash: submission.session.toolConfigHash,
      environmentSnapshot: submission.session.environmentSnapshot ? JSON.parse(submission.session.environmentSnapshot) : null,
    },
    demoOnly: true,
  })
}
