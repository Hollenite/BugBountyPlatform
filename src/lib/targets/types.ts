import { AgentSessionManager } from "@/lib/session/AgentSessionManager"
import { AgentId, EnvironmentSnapshot } from "@/types"

export type ConversationMessage = { role: "user" | "assistant"; content: string }

export type TargetRunResult = {
  response: string
}

export type NormalizedUnsafeInput = Record<string, string | null>

export interface TargetAgentAdapter {
  id: AgentId
  name: string
  systemPrompt: string
  tools: object[]
  getEnvironmentSnapshot(): EnvironmentSnapshot
  run(history: ConversationMessage[], session: AgentSessionManager): Promise<TargetRunResult>
  normalizeUnsafeToolInput(input?: Record<string, unknown>): NormalizedUnsafeInput
  unsafeToolInputsMatch(
    original?: Record<string, unknown>,
    replay?: Record<string, unknown>,
  ): boolean
  formatReplayComparison(
    original: NormalizedUnsafeInput,
    replay: NormalizedUnsafeInput,
    originalViolationType?: string,
    replayViolationType?: string,
  ): { unsafeToolLabel: string; inputLine: string; notReproducedLine: string }
}
