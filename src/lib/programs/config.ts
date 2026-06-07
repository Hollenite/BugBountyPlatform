import { z } from "zod"

export const HOSTED_AGENT_TEMPLATES = [
  {
    id: "refund-agent",
    name: "Refund approval sandbox",
    agentId: "refund-agent",
    description: "Hosted refund-agent workflow with approval-confusion and over-limit refund policy checks.",
  },
  {
    id: "workspace-copilot",
    name: "Workspace copilot sandbox",
    agentId: "workspace-copilot",
    description: "EchoLeak-inspired enterprise workspace assistant with inbox, documents, and canary exfiltration checks.",
  },
] as const

export type HostedAgentTemplateId = (typeof HOSTED_AGENT_TEMPLATES)[number]["id"]

const hostedTemplateIds = HOSTED_AGENT_TEMPLATES.map((template) => template.id)

export const ProgramConfigSchema = z.object({
  targetTemplateId: z.string().min(1),
  visibility: z.enum(["private", "public"]).default("private"),
  scope: z.object({
    allowedCategories: z.array(z.string().min(1)).default(["overspend"]),
    blockedTargets: z.array(z.string().min(1)).default(["external_api", "production_system"]),
  }).default({}),
  policy: z.object({
    maxRefundUsd: z.number().positive().optional(),
    requiresConfirmedViolation: z.boolean().default(true),
    workspacePolicies: z.array(z.string().min(1)).optional(),
  }).default({}),
  reward: z.object({
    display: z.string().min(1).default("Symbolic testnet reward only"),
  }).default({}),
})

export type ProgramConfig = z.infer<typeof ProgramConfigSchema>

export function parseProgramConfig(input: unknown): ProgramConfig {
  const config = ProgramConfigSchema.parse(input)

  if (!hostedTemplateIds.includes(config.targetTemplateId as HostedAgentTemplateId)) {
    throw new Error("Unsupported hosted sandbox template")
  }

  return config
}

export function getHostedTemplate(templateId: string) {
  return HOSTED_AGENT_TEMPLATES.find((template) => template.id === templateId) ?? null
}

export function serializeProgramConfig(config: unknown) {
  return JSON.stringify(config)
}
