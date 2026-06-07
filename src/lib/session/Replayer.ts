import { getTargetAdapter } from "@/lib/targets/registry"
import { deterministicHash, sha256 } from "@/lib/utils/hash"
import { ReplayBundle, ReplayComparison, ReplayStatus } from "@/types"
import { AgentSessionManager } from "./AgentSessionManager"

export type ReplayResult = {
  replayStatus: ReplayStatus
  comparison: ReplayComparison
  newSessionId: string
  detail: string
}

export async function replaySession(
  originalBundle: ReplayBundle,
  programId: string,
  verifierId: string,
): Promise<ReplayResult> {
  const adapter = getTargetAdapter(originalBundle.agentId)
  const environmentSnapshot = adapter.getEnvironmentSnapshot()

  const replaySession = await AgentSessionManager.create(
    programId,
    verifierId,
    originalBundle.agentId,
    "verifier_replay",
  )

  const currentSystemPromptHash = sha256(adapter.systemPrompt)
  const currentToolConfigHash = deterministicHash(adapter.tools)
  const currentEnvHash = deterministicHash(environmentSnapshot)
  const originalEnvHash = deterministicHash(originalBundle.environmentSnapshot)

  const history: { role: "user" | "assistant"; content: string }[] = []
  for (const userMessage of originalBundle.userMessages) {
    await replaySession.logUserMessage(userMessage)
    history.push({ role: "user", content: userMessage })
    const { response } = await adapter.run(history, replaySession)
    history.push({ role: "assistant", content: response })
  }

  await replaySession.updateReplayMetadata(adapter.systemPrompt, adapter.tools)
  const newBundle = await AgentSessionManager.buildReplayBundle(replaySession.getSessionId())

  const originalUnsafe = adapter.normalizeUnsafeToolInput(originalBundle.confirmedUnsafeToolInput)
  const replayUnsafe = adapter.normalizeUnsafeToolInput(newBundle.confirmedUnsafeToolInput)

  const comparison: ReplayComparison = {
    violationTypeMatch: newBundle.violationType === originalBundle.violationType,
    unsafeToolNameMatch: newBundle.confirmedUnsafeToolName === originalBundle.confirmedUnsafeToolName,
    unsafeToolInputMatch: adapter.unsafeToolInputsMatch(
      originalBundle.confirmedUnsafeToolInput,
      newBundle.confirmedUnsafeToolInput,
    ),
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

  const formatted = adapter.formatReplayComparison(
    originalUnsafe,
    replayUnsafe,
    originalBundle.violationType,
    newBundle.violationType,
  )

  return {
    replayStatus,
    comparison,
    newSessionId: replaySession.getSessionId(),
    detail: buildDetailString(replayStatus, comparison, formatted, originalBundle.violationType, newBundle.violationType),
  }
}

function buildDetailString(
  status: ReplayStatus,
  comparison: ReplayComparison,
  formatted: { unsafeToolLabel: string; inputLine: string; notReproducedLine: string },
  originalViolationType: string | undefined,
  replayViolationType: string | undefined,
): string {
  const icon = (value: boolean) => (value ? "✓" : "✗")

  if (status === "reproduced_exact") {
    return [
      "REPRODUCED EXACT",
      `${icon(comparison.violationTypeMatch)} Violation type: ${replayViolationType}`,
      `${icon(comparison.unsafeToolNameMatch)} Unsafe tool: ${formatted.unsafeToolLabel}`,
      `${icon(comparison.unsafeToolInputMatch)} ${formatted.inputLine}`,
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
      `${icon(comparison.unsafeToolInputMatch)} ${formatted.inputLine}`,
      `${icon(comparison.systemPromptHashMatch)} System prompt hash match: ${comparison.systemPromptHashMatch}`,
      `${icon(comparison.toolConfigHashMatch)} Tool config hash match: ${comparison.toolConfigHashMatch}`,
      `${icon(comparison.environmentHashMatch)} Environment hash match: ${comparison.environmentHashMatch}`,
    ].join("\n")
  }

  return [
    "NOT REPRODUCED",
    formatted.notReproducedLine,
    `Prompt hash match: ${comparison.systemPromptHashMatch}`,
    `Tool config hash match: ${comparison.toolConfigHashMatch}`,
  ].join("\n")
}
