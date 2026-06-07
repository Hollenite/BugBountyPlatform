import { prisma } from "@/lib/db"
import { deterministicHash } from "@/lib/utils/hash"
import { formatEther } from "ethers"

function tryParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function formatReward(wei: string | null | undefined) {
  if (!wei) return null
  const eth = Number(formatEther(BigInt(wei)))
  return `${eth.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")} ETH`
}

function formatUsd(value: number | null) {
  if (value === null) return "—"
  return `$${value.toFixed(0)}`
}

export function formatHash(hash: string | null | undefined) {
  if (!hash) return "Not available"
  if (hash.length <= 18) return hash
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function parseProgram(program: {
  scope: string
  scopeConfig?: string | null
  policyConfig?: string | null
  rewardConfig?: string | null
  visibility?: string | null
  targetTemplateId?: string | null
  rewardCriticalWei: string
  rewardHighWei: string
  rewardMediumWei: string
  rewardLowWei: string
  poolBalanceWei: string
}) {
  const scopeData = tryParseJson<{ allowedCategories?: string[] }>(program.scopeConfig ?? program.scope, {})

  return {
    scopeData,
    policyData: tryParseJson<Record<string, unknown>>(program.policyConfig, {}),
    rewardData: tryParseJson<Record<string, unknown>>(program.rewardConfig, {}),
    visibility: program.visibility ?? "private",
    targetTemplateId: program.targetTemplateId ?? "refund-agent",
    rewardPreview: formatReward(program.rewardCriticalWei),
    rewardCriticalLabel: formatReward(program.rewardCriticalWei),
    rewardHighLabel: formatReward(program.rewardHighWei),
    rewardMediumLabel: formatReward(program.rewardMediumWei),
    rewardLowLabel: formatReward(program.rewardLowWei),
    poolBalanceLabel: formatReward(program.poolBalanceWei),
  }
}

function extractViolation(events: Array<{ type: string; payload: Record<string, unknown> }>) {
  const event = events.find((item) => item.type === "confirmed_violation")
  if (!event) return null

  const violation = isRecord(event.payload.violation) ? event.payload.violation : null
  const unsafeInput = violation && isRecord(violation.unsafeToolInput) ? violation.unsafeToolInput : null

  return {
    type: getString(violation?.type),
    toolName: getString(violation?.unsafeToolName),
    detail: getString(violation?.detail),
    orderId: getString(unsafeInput?.order_id),
    amountValue: getNumber(unsafeInput?.amount_usd),
    amountLabel: formatUsd(getNumber(unsafeInput?.amount_usd)),
  }
}

export async function getProgramsForBoard() {
  const programs = await prisma.program.findMany({
    where: { active: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return programs.map((program) => ({
    ...program,
    ...parseProgram(program),
  }))
}

export async function getProgramForLab(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { company: { select: { name: true } } },
  })

  if (!program) return null

  return {
    ...program,
    ...parseProgram(program),
  }
}

export async function getSubmissionsForQueue() {
  const submissions = await prisma.submission.findMany({
    include: {
      program: {
        select: {
          id: true,
          name: true,
          rewardCriticalWei: true,
          rewardHighWei: true,
          rewardMediumWei: true,
          rewardLowWei: true,
        },
      },
      researcher: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return submissions.map((submission) => ({
    ...submission,
    topRewardLabel: formatReward(submission.program.rewardCriticalWei),
    payoutLabel: formatReward(submission.payoutWei),
    createdAtLabel: formatDate(submission.createdAt),
    resolvedAtLabel: formatDate(submission.resolvedAt),
  }))
}

export async function getSubmissionReview(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      program: true,
      researcher: { select: { id: true, name: true, email: true, wallet: true } },
      session: true,
    },
  })

  if (!submission) return null

  const replaySession = submission.replaySessionId
    ? await prisma.agentSession.findUnique({ where: { id: submission.replaySessionId } })
    : null

  const [events, replayEvents] = await Promise.all([
    prisma.traceEvent.findMany({
      where: { sessionId: submission.sessionId },
      orderBy: { index: "asc" },
    }),
    submission.replaySessionId
      ? prisma.traceEvent.findMany({
          where: { sessionId: submission.replaySessionId },
          orderBy: { index: "asc" },
        })
      : Promise.resolve([]),
  ])

  const originalEvents = events.map((event) => ({
    index: event.index,
    type: event.type,
    toolName: event.toolName,
    payload: tryParseJson<Record<string, unknown>>(event.payload, {}),
    flagged: event.flagged,
    createdAt: event.createdAt.toISOString(),
  }))

  const replayEventList = replayEvents.map((event) => ({
    index: event.index,
    type: event.type,
    toolName: event.toolName,
    payload: tryParseJson<Record<string, unknown>>(event.payload, {}),
    flagged: event.flagged,
    createdAt: event.createdAt.toISOString(),
  }))

  const replayComparisonData = tryParseJson<Record<string, boolean>>(submission.replayComparison, {})
  const originalViolation = extractViolation(originalEvents)
  const replayViolation = extractViolation(replayEventList)
  const originalEnvironment = tryParseJson<Record<string, unknown>>(submission.session.environmentSnapshot, {})
  const replayEnvironment = tryParseJson<Record<string, unknown>>(replaySession?.environmentSnapshot, {})

  const originalSessionMetadata = {
    modelId: submission.session.modelId,
    modelParams: tryParseJson<Record<string, unknown>>(submission.session.modelParams, {}),
    systemPromptHash: submission.session.systemPromptHash,
    toolConfigHash: submission.session.toolConfigHash,
    environmentSnapshot: originalEnvironment,
    environmentHash: Object.keys(originalEnvironment).length ? deterministicHash(originalEnvironment) : null,
  }

  const replaySessionMetadata = replaySession
    ? {
        modelId: replaySession.modelId,
        modelParams: tryParseJson<Record<string, unknown>>(replaySession.modelParams, {}),
        systemPromptHash: replaySession.systemPromptHash,
        toolConfigHash: replaySession.toolConfigHash,
        environmentSnapshot: replayEnvironment,
        environmentHash: Object.keys(replayEnvironment).length ? deterministicHash(replayEnvironment) : null,
      }
    : null

  const comparisonFacts = [
    {
      label: "Violation type",
      original: originalViolation?.type ?? "—",
      replay: replayViolation?.type ?? "—",
      match: replayComparisonData.violationTypeMatch ?? null,
    },
    {
      label: "Tool name",
      original: originalViolation?.toolName ?? "—",
      replay: replayViolation?.toolName ?? "—",
      match: replayComparisonData.unsafeToolNameMatch ?? null,
    },
    {
      label: "Order ID",
      original: originalViolation?.orderId ?? "—",
      replay: replayViolation?.orderId ?? "—",
      match:
        originalViolation?.orderId && replayViolation?.orderId
          ? originalViolation.orderId === replayViolation.orderId
          : replayComparisonData.unsafeToolInputMatch ?? null,
    },
    {
      label: "Amount",
      original: originalViolation?.amountLabel ?? "—",
      replay: replayViolation?.amountLabel ?? "—",
      match:
        originalViolation?.amountValue !== undefined && replayViolation?.amountValue !== undefined
          ? originalViolation.amountValue === replayViolation.amountValue
          : replayComparisonData.unsafeToolInputMatch ?? null,
    },
    {
      label: "System prompt hash",
      original: formatHash(originalSessionMetadata.systemPromptHash),
      replay: formatHash(replaySessionMetadata?.systemPromptHash),
      match: replayComparisonData.systemPromptHashMatch ?? null,
      mono: true,
    },
    {
      label: "Tool config hash",
      original: formatHash(originalSessionMetadata.toolConfigHash),
      replay: formatHash(replaySessionMetadata?.toolConfigHash),
      match: replayComparisonData.toolConfigHashMatch ?? null,
      mono: true,
    },
    {
      label: "Environment",
      original: Object.keys(originalEnvironment).length ? "Original snapshot" : "—",
      replay: replaySessionMetadata ? "Verifier rerun snapshot" : "—",
      match: replayComparisonData.environmentHashMatch ?? null,
    },
    {
      label: "Environment hash",
      original: formatHash(originalSessionMetadata.environmentHash),
      replay: formatHash(replaySessionMetadata?.environmentHash),
      match: replayComparisonData.environmentHashMatch ?? null,
      mono: true,
    },
  ]

  return {
    submission: {
      ...submission,
      replayComparisonData,
      payoutLabel: formatReward(submission.payoutWei),
      createdAtLabel: formatDate(submission.createdAt),
      resolvedAtLabel: formatDate(submission.resolvedAt),
      evidenceHashShort: formatHash(submission.evidenceHash),
      reportHashShort: formatHash(submission.reportHash),
    },
    program: {
      ...submission.program,
      ...parseProgram(submission.program),
    },
    researcher: submission.researcher,
    session: submission.session,
    events: originalEvents,
    replayEvents: replayEventList,
    originalViolation,
    replayViolation,
    originalSessionMetadata,
    replaySessionMetadata,
    comparisonFacts,
  }
}
