import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const CreateProgramSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(3).max(100),
  agentId: z.enum(["refund-agent"]),
  description: z.string().min(10).max(500),
  scope: z.object({ allowedCategories: z.array(z.string()) }),
})

export async function GET() {
  const programs = await prisma.program.findMany({
    where: { active: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateProgramSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // DEMO ROLE SIMULATION
  const user = await prisma.user.findUnique({ where: { id: parsed.data.companyId } })
  if (!user || user.role !== "company") {
    return NextResponse.json({ error: "Only companies can create programs" }, { status: 403 })
  }

  const program = await prisma.program.create({
    data: {
      id: crypto.randomUUID(),
      companyId: parsed.data.companyId,
      name: parsed.data.name,
      agentId: parsed.data.agentId,
      description: parsed.data.description,
      scope: JSON.stringify(parsed.data.scope),
    },
  })

  return NextResponse.json(program, { status: 201 })
}
