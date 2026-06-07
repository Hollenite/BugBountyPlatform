import { refundAgentAdapter } from "@/lib/targets/refundAdapter"
import { workspaceCopilotAdapter } from "@/lib/targets/workspaceAdapter"
import { TargetAgentAdapter } from "@/lib/targets/types"
import { AgentId } from "@/types"

const adapters: Record<AgentId, TargetAgentAdapter> = {
  "refund-agent": refundAgentAdapter,
  "workspace-copilot": workspaceCopilotAdapter,
}

export function getTargetAdapter(agentId: string): TargetAgentAdapter {
  const adapter = adapters[agentId as AgentId]
  if (!adapter) {
    throw new Error(`Unsupported target agent: ${agentId}`)
  }
  return adapter
}

export function listTargetAdapters(): TargetAgentAdapter[] {
  return Object.values(adapters)
}
