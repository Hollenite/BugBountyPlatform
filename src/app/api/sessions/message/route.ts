import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import { SendMessageSchema } from "@/lib/validation"
import { getTargetAdapter } from "@/lib/targets/registry"
import { authErrorResponse, requireRoleFromRequest } from "@/lib/auth/session"
import type { AgentId } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleFromRequest(req, "researcher")
    const body = await req.json()
    const parsed = SendMessageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { sessionId, message } = parsed.data

    const dbSession = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: { events: { orderBy: { index: "asc" } } },
    })

    if (!dbSession || dbSession.actorId !== user.id) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 403 })
    }

    if (dbSession.sessionType !== "researcher") {
      return NextResponse.json({ error: "Replay sessions cannot accept researcher messages" }, { status: 400 })
    }

    if (dbSession.status !== "active") {
      return NextResponse.json({ error: "Session is no longer active" }, { status: 400 })
    }

    const adapter = getTargetAdapter(dbSession.agentId)
    const session = await AgentSessionManager.restore(sessionId)
    await session.logUserMessage(message)

    const history: { role: "user" | "assistant"; content: string }[] = dbSession.events
      .filter((event) => event.type === "user_message" || event.type === "assistant_message")
      .map((event) => ({
        role: event.type === "user_message" ? "user" : "assistant",
        content: (JSON.parse(event.payload) as { content: string }).content,
      }))

    history.push({ role: "user", content: message })

    const { response } = await adapter.run(history, session)
    await session.updateReplayMetadata(adapter.systemPrompt, adapter.tools)

    const freshEvents = await prisma.traceEvent.findMany({
      where: { sessionId },
      orderBy: { index: "asc" },
    })

    return NextResponse.json({
      response,
      sessionId,
      agentId: dbSession.agentId as AgentId,
      confirmedViolation: session.hasViolation(),
      violationType: session.getViolationType(),
      unsafeToolName: session.getUnsafeToolName(),
      unsafeToolInput: session.getUnsafeToolInput(),
      events: freshEvents.map((event) => ({
        index: event.index,
        type: event.type,
        toolName: event.toolName,
        payload: JSON.parse(event.payload),
        flagged: event.flagged,
        createdAt: event.createdAt,
      })),
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
