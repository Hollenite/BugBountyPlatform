import { DEMO_ENVIRONMENT } from "@/lib/constants"
import { REFUND_SYSTEM_PROMPT, REFUND_TOOLS, runRefundAgent } from "@/lib/agents/refundAgent"
import { deterministicHash, sha256 } from "@/lib/utils/hash"
import { ReplayBundle, ReplayComparison, ReplayStatus } from "@/types"
import { AgentSessionManager } from "./AgentSessionManager"

export type ReplayResult = {
  replayStatus: ReplayStatus
  comparison: ReplayComparison
  newSessionId: string
  detail: string
}

function normalizeToolInput(input?: Record<string, unknown>) {
  return {
    order_id: typeof input?.order_id === "string" ? input.order_id.toUpperCase() : null,
    amount_usd: Number(input?.amount_usd),
  }
}

export async function replaySession(
  originalBundle: ReplayBundle,
  programId: string,
  verifierId: string,
): Promise<ReplayResult> {
  const replaySession = await AgentSessionManager.create(
    programId,
    verifierId,
    originalBundle.agentId,
    "verifier_replay",
  )

  const currentSystemPromptHash = sha256(REFUND_SYSTEM_PROMPT)
  const currentToolConfigHash = deterministicHash(REFUND_TOOLS)
  const currentEnvHash = deterministicHash(DEMO_ENVIRONMENT)
  const originalEnvHash = deterministicHash(originalBundle.environmentSnapshot)

  const history: { role: "user" | "assistant"; content: string }[] = []
  for (const userMessage of originalBundle.userMessages) {
    await replaySession.logUserMessage(userMessage)
    history.push({ role: "user", content: userMessage })
    const { response } = await runRefundAgent(history, replaySession)
    history.push({ role: "assistant", content: response })
  }

  await replaySession.updateReplayMetadata(REFUND_SYSTEM_PROMPT, REFUND_TOOLS)
  const newBundle = await AgentSessionManager.buildReplayBundle(replaySession.getSessionId())

  const originalUnsafe = normalizeToolInput(originalBundle.confirmedUnsafeToolInput)
  const replayUnsafe = normalizeToolInput(newBundle.confirmedUnsafeToolInput)

  const comparison: ReplayComparison = {
    violationTypeMatch: newBundle.violationType === originalBundle.violationType,
    unsafeToolNameMatch: newBundle.confirmedUnsafeToolName === originalBundle.confirmedUnsafeToolName,
    unsafeToolInputMatch:
      originalUnsafe.order_id === replayUnsafe.order_id &&
      originalUnsafe.amount_usd === replayUnsafe.amount_usd,
    systemPromptHashMatch: currentSystemPromptHash === originalBundle.systemPromptHash,
    toolConfigHashMatch: currentToolConfigHash === originalBundle.toolConfigHash,
    environmentHashMatch: currentEnvHash === originalEnvHash,
  }

  const violationReproduced =
    newBundle.confirmedViolation &&
    comparison.violationTypeMatch &&
    comparison.unsafeToolNameMatch &&
    comparison.unsafeToolInputMatch

  const allHashesMatch =
    comparison.systemPromptHashMatch &&
    comparison.toolConfigHashMatch &&
    comparison.environmentHashMatch

  const replayStatus: ReplayStatus = !violationReproduced
    ? "not_reproduced"
    : allHashesMatch
      ? "reproduced_exact"
      : "reproduced_with_mismatch"

  return {
    replayStatus,
    comparison,
    newSessionId: replaySession.getSessionId(),
    detail: buildDetailString(replayStatus, comparison, originalUnsafe, replayUnsafe, originalBundle.violationType, newBundle.violationType),
  }
}

function buildDetailString(
  status: ReplayStatus,
  comparison: ReplayComparison,
  originalUnsafe: { order_id: string | null; amount_usd: number },
  replayUnsafe: { order_id: string | null; amount_usd: number },
  originalViolationType: string | undefined,
  replayViolationType: string | undefined,
): string {
  const icon = (value: boolean) => (value ? "✓" : "✗")

  if (status === "reproduced_exact") {
    return [
      "REPRODUCED EXACT",
      `${icon(comparison.violationTypeMatch)} Violation type: ${replayViolationType}`,
      `${icon(comparison.unsafeToolNameMatch)} Unsafe tool: issue_refund`,
      `${icon(comparison.unsafeToolInputMatch)} Original: ${originalUnsafe.order_id} $${originalUnsafe.amount_usd} | Replay: ${replayUnsafe.order_id} $${replayUnsafe.amount_usd}`,
      `${icon(comparison.systemPromptHashMatch)} System prompt hash match`,
      `${icon(comparison.toolConfigHashMatch)} Tool config hash match`,
      `${icon(comparison.environmentHashMatch)} Environment hash match`,
    ].join("\n")
  }

  if (status === "reproduced_with_mismatch") {
    return [
      "REPRODUCED (WITH ENVIRONMENT MISMATCH — approval blocked)",
      `${icon(comparison.violationTypeMatch)} Violation type: ${replayViolationType}`,
      `${icon(comparison.unsafeToolNameMatch)} Unsafe tool match`,
      `${icon(comparison.unsafeToolInputMatch)} Order+amount: orig=${originalUnsafe.order_id} $${originalUnsafe.amount_usd} | replay=${replayUnsafe.order_id} $${replayUnsafe.amount_usd}`,
      `${icon(comparison.systemPromptHashMatch)} System prompt hash match: ${comparison.systemPromptHashMatch}`,
      `${icon(comparison.toolConfigHashMatch)} Tool config hash match: ${comparison.toolConfigHashMatch}`,
      `${icon(comparison.environmentHashMatch)} Environment hash match: ${comparison.environmentHashMatch}`,
    ].join("\n")
  }

  return [
    "NOT REPRODUCED",
    `Original type: ${originalViolationType ?? "none"} | Replay type: ${replayViolationType ?? "none"}`,
    `Original unsafe input: ${originalUnsafe.order_id} $${originalUnsafe.amount_usd} | Replay: ${replayUnsafe.order_id} $${replayUnsafe.amount_usd}`,
    `Prompt hash match: ${comparison.systemPromptHashMatch}`,
    `Tool config hash match: ${comparison.toolConfigHashMatch}`,
  ].join("\n")
}
