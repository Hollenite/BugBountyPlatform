import { z } from "zod"

const uuid = z.string().uuid()
const nonEmptyStringId = z.string().min(1)

export const StartSessionSchema = z.object({
  programId: nonEmptyStringId,
})

export const SendMessageSchema = z.object({
  sessionId: uuid,
  message: z.string().min(1).max(2000),
})

export const SubmitFindingSchema = z.object({
  sessionId: uuid,
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  stepsToRepro: z.string().min(10).max(2000),
  expectedBehavior: z.string().min(10).max(1000),
  actualBehavior: z.string().min(10).max(1000),
})

export const VerifyActionSchema = z.object({
  action: z.enum(["replay", "approve", "reject"]),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  verifierNote: z.string().min(10).max(1000).optional(),
})

export const CreateProgramSchema = z.object({
  id: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(5).max(160),
  description: z.string().min(20).max(2000),
  targetTemplateId: z.string().min(1),
  visibility: z.enum(["private", "public"]).default("private"),
  scope: z.object({
    allowedCategories: z.array(z.string().min(1)).default(["overspend"]),
    blockedTargets: z.array(z.string().min(1)).default(["external_api", "production_system"]),
  }).default({}),
  policy: z.object({
    maxRefundUsd: z.number().positive().default(50),
    requiresConfirmedViolation: z.boolean().default(true),
  }).default({}),
  reward: z.object({
    display: z.string().min(1).default("Symbolic testnet reward only"),
  }).default({}),
  active: z.boolean().default(true),
})

export const ChainRecordSchema = z.object({
  chainFindingId: z.number().int().nonnegative(),
  submitFindingTx: z.string().min(10),
  payoutTx: z.string().min(10).optional(),
  verifierId: uuid,
})
