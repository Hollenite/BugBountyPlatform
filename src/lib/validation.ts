import { z } from "zod"

const uuid = z.string().uuid()
const nonEmptyStringId = z.string().min(1)

export const StartSessionSchema = z.object({
  programId: nonEmptyStringId,
  researcherId: uuid,
})

export const SendMessageSchema = z.object({
  sessionId: uuid,
  message: z.string().min(1).max(2000),
  researcherId: uuid,
})

export const SubmitFindingSchema = z.object({
  sessionId: uuid,
  researcherId: uuid,
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  stepsToRepro: z.string().min(10).max(2000),
  expectedBehavior: z.string().min(10).max(1000),
  actualBehavior: z.string().min(10).max(1000),
  researcherWallet: z.string().optional(),
})

export const VerifyActionSchema = z.object({
  action: z.enum(["replay", "approve", "reject"]),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  verifierNote: z.string().min(10).max(1000).optional(),
  verifierId: uuid,
})

export const ChainRecordSchema = z.object({
  chainFindingId: z.number().int().nonnegative(),
  submitFindingTx: z.string().min(10),
  payoutTx: z.string().min(10).optional(),
  verifierId: uuid,
})
