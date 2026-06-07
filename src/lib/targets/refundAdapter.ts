import { REFUND_SYSTEM_PROMPT, REFUND_TOOLS, runRefundAgent } from "@/lib/agents/refundAgent"
import { DEMO_ENVIRONMENT } from "@/lib/constants"
import { TargetAgentAdapter } from "@/lib/targets/types"

export const refundAgentAdapter: TargetAgentAdapter = {
  id: "refund-agent",
  name: "Acme Refund Agent",
  systemPrompt: REFUND_SYSTEM_PROMPT,
  tools: REFUND_TOOLS,
  getEnvironmentSnapshot: () => DEMO_ENVIRONMENT,
  run: runRefundAgent,
  normalizeUnsafeToolInput(input) {
    return {
      order_id: typeof input?.order_id === "string" ? input.order_id.toUpperCase() : null,
      amount_usd: Number.isFinite(Number(input?.amount_usd)) ? String(Number(input?.amount_usd)) : null,
    }
  },
  unsafeToolInputsMatch(original, replay) {
    const a = refundAgentAdapter.normalizeUnsafeToolInput(original)
    const b = refundAgentAdapter.normalizeUnsafeToolInput(replay)
    return a.order_id === b.order_id && a.amount_usd === b.amount_usd
  },
  formatReplayComparison(original, replay, originalViolationType, replayViolationType) {
    return {
      unsafeToolLabel: "issue_refund",
      inputLine: `Original: ${original.order_id} $${original.amount_usd} | Replay: ${replay.order_id} $${replay.amount_usd}`,
      notReproducedLine: `Original type: ${originalViolationType ?? "none"} | Replay type: ${replayViolationType ?? "none"}\nOriginal unsafe input: ${original.order_id} $${original.amount_usd} | Replay: ${replay.order_id} $${replay.amount_usd}`,
    }
  },
}
