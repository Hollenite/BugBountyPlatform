import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { StartSessionSchema } from "@/lib/validation"
import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import type { AgentId } from "@/types"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = StartSessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { programId, researcherId } = parsed.data

  // DEMO ROLE SIMULATION
  const user = await prisma.user.findUnique({ where: { id: researcherId } })
  if (!user || user.role !== "researcher") {
    return NextResponse.json({ error: "Only researchers can start sessions" }, { status: 403 })
  }

  const program = await prisma.program.findUnique({ where: { id: programId } })
  if (!program || !program.active) {
    return NextResponse.json({ error: "Program not found or inactive" }, { status: 404 })
  }

  const session = await AgentSessionManager.create(programId, researcherId, program.agentId as AgentId, "researcher")
  return NextResponse.json({ sessionId: session.getSessionId() })
}
