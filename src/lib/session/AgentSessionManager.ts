import { prisma } from "@/lib/db"
import { DEMO_ENVIRONMENT, MODEL_ID, MODEL_PARAMS } from "@/lib/constants"
import { deterministicHash, sha256 } from "@/lib/utils/hash"
import {
  AgentId,
  ConfirmedViolation,
  EnvironmentSnapshot,
  FailureCategory,
  ReplayBundle,
  RiskSignal,
  SessionType,
  TraceEventPayload,
  TraceEventType,
} from "@/types"

export class AgentSessionManager {
  private sessionId: string
  private eventIndex = 0
  private riskSignals: RiskSignal[] = []
  private confirmedViolation = false
  private violationType?: FailureCategory
  private confirmedUnsafeToolName?: string
  private confirmedUnsafeToolInput?: Record<string, unknown>

  constructor(sessionId: string, startingIndex = 0) {
    this.sessionId = sessionId
    this.eventIndex = startingIndex
  }

  static async create(
    programId: string,
    actorId: string,
    agentId: AgentId,
    sessionType: SessionType = "researcher",
  ): Promise<AgentSessionManager> {
    const session = await prisma.agentSession.create({
      data: {
        programId,
        actorId,
        agentId,
        sessionType,
        status: "active",
        environmentSnapshot: JSON.stringify(DEMO_ENVIRONMENT),
      },
    })

    return new AgentSessionManager(session.id, 0)
  }

  static async restore(sessionId: string): Promise<AgentSessionManager> {
    const events = await prisma.traceEvent.findMany({
      where: { sessionId },
      orderBy: { index: "asc" },
    })

    const manager = new AgentSessionManager(sessionId, events.length)
    const violationEvent = events.find((event) => event.type === "confirmed_violation")

    if (violationEvent) {
      const payload = JSON.parse(violationEvent.payload) as TraceEventPayload
      manager.confirmedViolation = true
      manager.violationType = payload.violation?.type
      manager.confirmedUnsafeToolName = payload.violation?.unsafeToolName
      manager.confirmedUnsafeToolInput = payload.violation?.unsafeToolInput
    }

    for (const event of events) {
      if (event.type === "risk_signal") {
        const payload = JSON.parse(event.payload) as TraceEventPayload
        if (payload.signal) manager.riskSignals.push(payload.signal)
      }
    }

    return manager
  }

  getSessionId() {
    return this.sessionId
  }

  hasViolation() {
    return this.confirmedViolation
  }

  getViolationType() {
    return this.violationType
  }

  getUnsafeToolName() {
    return this.confirmedUnsafeToolName
  }

  getUnsafeToolInput() {
    return this.confirmedUnsafeToolInput
  }

  private async appendEvent(
    type: TraceEventType,
    payload: TraceEventPayload,
    toolName?: string,
    flagged = false,
  ) {
    await prisma.traceEvent.create({
      data: {
        sessionId: this.sessionId,
        index: this.eventIndex++,
        type,
        toolName: toolName ?? null,
        payload: JSON.stringify(payload),
        flagged,
      },
    })
  }

  async logUserMessage(content: string) {
    await this.appendEvent("user_message", { content })
  }

  async logAssistantMessage(content: string) {
    await this.appendEvent("assistant_message", { content })
  }

  async logAssistantToolUse(toolUseId: string, toolName: string, toolInput: unknown, rawBlock: unknown) {
    await this.appendEvent("assistant_tool_use", { toolUseId, toolInput, rawBlock }, toolName)
  }

  async logRiskSignal(rule: string, detail: string) {
    const signal: RiskSignal = { rule, detail, timestamp: new Date().toISOString() }
    this.riskSignals.push(signal)
    await this.appendEvent("risk_signal", { signal })
  }

  async logToolCall(toolName: string, toolInput: unknown) {
    await this.appendEvent("tool_call", { toolInput }, toolName)
  }

  async logToolResult(toolName: string, toolOutput: unknown) {
    await this.appendEvent("tool_result", { toolOutput }, toolName)
  }

  async logPolicyCheck(rule: string, passed: boolean, detail?: string) {
    await this.appendEvent("policy_check", { rule, passed, content: detail }, undefined, !passed)
  }

  async confirmViolation(
    type: FailureCategory,
    detail: string,
    unsafeToolName: string,
    unsafeToolInput: Record<string, unknown>,
  ) {
    this.confirmedViolation = true
    this.violationType = type
    this.confirmedUnsafeToolName = unsafeToolName
    this.confirmedUnsafeToolInput = unsafeToolInput

    const violation: ConfirmedViolation = {
      type,
      detail,
      timestamp: new Date().toISOString(),
      unsafeToolName,
      unsafeToolInput,
    }

    await this.appendEvent("confirmed_violation", { violation }, undefined, true)
  }

  async updateReplayMetadata(systemPromptText: string, toolSchemas: object[]) {
    await prisma.agentSession.update({
      where: { id: this.sessionId },
      data: {
        modelId: MODEL_ID,
        modelParams: JSON.stringify(MODEL_PARAMS),
        systemPromptHash: sha256(systemPromptText),
        toolConfigHash: deterministicHash(toolSchemas),
      },
    })
  }

  static markSessionSubmittedTx(tx: typeof prisma, sessionId: string) {
    return tx.agentSession.update({
      where: { id: sessionId },
      data: { status: "submitted", closedAt: new Date() },
    })
  }

  static setSessionResolutionTx(
    tx: typeof prisma,
    sessionId: string,
    status: "accepted" | "rejected",
  ) {
    return tx.agentSession.update({
      where: { id: sessionId },
      data: { status },
    })
  }

  static async buildReplayBundle(sessionId: string): Promise<ReplayBundle> {
    const session = await prisma.agentSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { events: { orderBy: { index: "asc" } } },
    })

    const storedEvents = session.events.map((event) => ({
      index: event.index,
      type: event.type as TraceEventType,
      toolName: event.toolName ?? undefined,
      payload: JSON.parse(event.payload) as TraceEventPayload,
      flagged: event.flagged,
      createdAt: event.createdAt.toISOString(),
    }))

    const userMessages = storedEvents
      .filter((event) => event.type === "user_message")
      .map((event) => event.payload.content ?? "")

    const riskSignals = storedEvents
      .filter((event) => event.type === "risk_signal")
      .map((event) => event.payload.signal)
      .filter((signal): signal is RiskSignal => Boolean(signal))

    const violationEvent = storedEvents.find((event) => event.type === "confirmed_violation")
    const environmentSnapshot: EnvironmentSnapshot = session.environmentSnapshot
      ? JSON.parse(session.environmentSnapshot)
      : DEMO_ENVIRONMENT

    return {
      sessionId,
      agentId: session.agentId as AgentId,
      modelId: session.modelId ?? MODEL_ID,
      modelParams: session.modelParams ? JSON.parse(session.modelParams) : MODEL_PARAMS,
      systemPromptHash: session.systemPromptHash ?? "",
      toolConfigHash: session.toolConfigHash ?? "",
      environmentSnapshot,
      userMessages,
      fullEventLog: storedEvents,
      confirmedViolation: Boolean(violationEvent),
      violationType: violationEvent?.payload.violation?.type,
      confirmedUnsafeToolName: violationEvent?.payload.violation?.unsafeToolName,
      confirmedUnsafeToolInput: violationEvent?.payload.violation?.unsafeToolInput,
      riskSignals,
    }
  }
}
