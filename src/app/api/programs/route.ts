import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authErrorResponse, requireRoleFromRequest } from "@/lib/auth/session"
import { parseProgramConfig, getHostedTemplate, serializeProgramConfig } from "@/lib/programs/config"
import { CreateProgramSchema } from "@/lib/validation"

export async function GET() {
  const programs = await prisma.program.findMany({
    where: { active: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleFromRequest(req, "company")
    const body = await req.json()
    const parsed = CreateProgramSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const config = parseProgramConfig(parsed.data)
    const template = getHostedTemplate(config.targetTemplateId)
    if (!template) return NextResponse.json({ error: "Unsupported hosted sandbox template" }, { status: 422 })

    const program = await prisma.program.create({
      data: {
        id: parsed.data.id ?? crypto.randomUUID(),
        companyId: user.id,
        name: parsed.data.name,
        agentId: template.agentId,
        description: parsed.data.description,
        scope: JSON.stringify(config.scope),
        targetTemplateId: config.targetTemplateId,
        visibility: config.visibility,
        scopeConfig: serializeProgramConfig(config.scope),
        policyConfig: serializeProgramConfig(config.policy),
        rewardConfig: serializeProgramConfig(config.reward),
        active: parsed.data.active,
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
