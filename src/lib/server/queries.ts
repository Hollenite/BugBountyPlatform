import { prisma } from "@/lib/db"
import { formatEther } from "ethers"

function tryParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function formatReward(wei: string | null | undefined) {
  if (!wei) return null
  const eth = Number(formatEther(BigInt(wei)))
  return `${eth.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")} ETH`
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

export async function getDefaultActors() {
  const [researcher, verifier] = await Promise.all([
    prisma.user.findFirst({ where: { role: "researcher" }, orderBy: { createdAt: "asc" } }),
    prisma.user.findFirst({ where: { role: "verifier" }, orderBy: { createdAt: "asc" } }),
  ])

  return {
    researcherId: researcher?.id ?? "",
    verifierId: verifier?.id ?? "",
  }
}

export async function getProgramsForBoard() {
  const programs = await prisma.program.findMany({
    where: { active: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return programs.map((program) => {
    const parsedScope = tryParseJson<{ allowedCategories?: string[] }>(program.scope, {})

    return {
      ...program,
      scopeData: parsedScope,
      rewardPreview: formatReward(program.rewardCriticalWei),
      poolBalanceLabel: formatReward(program.poolBalanceWei),
    }
  })
}

export async function getProgramForLab(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { company: { select: { name: true } } },
  })

  if (!program) return null

  return {
    ...program,
    scopeData: tryParseJson<{ allowedCategories?: string[] }>(program.scope, {}),
    rewardPreview: formatReward(program.rewardCriticalWei),
    poolBalanceLabel: formatReward(program.poolBalanceWei),
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
  const [submission, defaultActors] = await Promise.all([
    prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        program: true,
        researcher: { select: { id: true, name: true, email: true, wallet: true } },
        session: true,
      },
    }),
    getDefaultActors(),
  ])

  if (!submission) return null

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

  return {
    submission: {
      ...submission,
      replayComparisonData: tryParseJson<Record<string, boolean>>(submission.replayComparison, {}),
      payoutLabel: formatReward(submission.payoutWei),
      createdAtLabel: formatDate(submission.createdAt),
      resolvedAtLabel: formatDate(submission.resolvedAt),
      evidenceHashShort: formatHash(submission.evidenceHash),
      reportHashShort: formatHash(submission.reportHash),
    },
    program: {
      ...submission.program,
      scopeData: tryParseJson<{ allowedCategories?: string[] }>(submission.program.scope, {}),
      rewardCriticalLabel: formatReward(submission.program.rewardCriticalWei),
      rewardHighLabel: formatReward(submission.program.rewardHighWei),
      rewardMediumLabel: formatReward(submission.program.rewardMediumWei),
      rewardLowLabel: formatReward(submission.program.rewardLowWei),
      poolBalanceLabel: formatReward(submission.program.poolBalanceWei),
    },
    researcher: submission.researcher,
    session: submission.session,
    events: events.map((event) => ({
      index: event.index,
      type: event.type,
      toolName: event.toolName,
      payload: tryParseJson<Record<string, unknown>>(event.payload, {}),
      flagged: event.flagged,
      createdAt: event.createdAt.toISOString(),
    })),
    replayEvents: replayEvents.map((event) => ({
      index: event.index,
      type: event.type,
      toolName: event.toolName,
      payload: tryParseJson<Record<string, unknown>>(event.payload, {}),
      flagged: event.flagged,
      createdAt: event.createdAt.toISOString(),
    })),
    replayBundleMetadata: {
      modelId: submission.session.modelId,
      modelParams: tryParseJson<Record<string, unknown>>(submission.session.modelParams, {}),
      systemPromptHash: submission.session.systemPromptHash,
      toolConfigHash: submission.session.toolConfigHash,
      environmentSnapshot: tryParseJson<Record<string, unknown>>(submission.session.environmentSnapshot, {}),
    },
    defaultVerifierId: defaultActors.verifierId,
  }
}
