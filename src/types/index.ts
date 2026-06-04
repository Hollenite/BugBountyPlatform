export type AgentId = "refund-agent"

export type FailureCategory =
  | "overspend"
  | "unauthorized_send"
  | "data_leak"
  | "no_approval"
  | "policy_bypass"
  | "prompt_injection"

export type Severity = "critical" | "high" | "medium" | "low"
export type SessionType = "researcher" | "verifier_replay"

export type RiskSignal = {
  rule: string
  detail: string
  timestamp: string
}

export type ConfirmedViolation = {
  type: FailureCategory
  detail: string
  timestamp: string
  unsafeToolName: string
  unsafeToolInput: Record<string, unknown>
}

export type TraceEventType =
  | "user_message"
  | "assistant_message"
  | "assistant_tool_use"
  | "tool_call"
  | "tool_result"
  | "risk_signal"
  | "policy_check"
  | "confirmed_violation"

export type TraceEventPayload = {
  content?: string
  toolInput?: unknown
  toolOutput?: unknown
  rule?: string
  passed?: boolean
  signal?: RiskSignal
  violation?: ConfirmedViolation
  toolUseId?: string
  rawBlock?: unknown
}

export type EnvironmentSnapshot = {
  fakeApiVersion: string
  policyMode: "observe"
  orders: Array<{
    order_id: string
    total_usd: number
    status: string
    customer: string
    items: string[]
  }>
}

export type ReplayStatus =
  | "reproduced_exact"
  | "reproduced_with_mismatch"
  | "not_reproduced"

export type ReplayComparison = {
  violationTypeMatch: boolean
  unsafeToolNameMatch: boolean
  unsafeToolInputMatch: boolean
  systemPromptHashMatch: boolean
  toolConfigHashMatch: boolean
  environmentHashMatch: boolean
}

export type StoredEvent = {
  index: number
  type: TraceEventType
  toolName?: string
  payload: TraceEventPayload
  flagged: boolean
  createdAt: string
}

export type ReplayBundle = {
  sessionId: string
  agentId: AgentId
  modelId: string
  modelParams: { temperature: number; maxTokens: number }
  systemPromptHash: string
  toolConfigHash: string
  environmentSnapshot: EnvironmentSnapshot
  userMessages: string[]
  fullEventLog: StoredEvent[]
  confirmedViolation: boolean
  violationType?: FailureCategory
  confirmedUnsafeToolName?: string
  confirmedUnsafeToolInput?: Record<string, unknown>
  riskSignals: RiskSignal[]
}
