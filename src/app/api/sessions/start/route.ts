import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { StartSessionSchema } from "@/lib/validation"
import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import type { AgentId } from "@/types"
import { authErrorResponse, requireRoleFromRequest } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleFromRequest(req, "researcher")
    const body = await req.json()
    const parsed = StartSessionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { programId } = parsed.data

    const program = await prisma.program.findUnique({ where: { id: programId } })
    if (!program || !program.active) {
      return NextResponse.json({ error: "Program not found or inactive" }, { status: 404 })
    }

    const session = await AgentSessionManager.create(programId, user.id, program.agentId as AgentId, "researcher")
    return NextResponse.json({ sessionId: session.getSessionId() })
  } catch (error) {
    return authErrorResponse(error)
  }
}
