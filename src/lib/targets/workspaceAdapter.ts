import { runWorkspaceCopilotAgent, WORKSPACE_SYSTEM_PROMPT, WORKSPACE_TOOLS } from "@/lib/agents/workspaceCopilotAgent"
import { WORKSPACE_ENVIRONMENT } from "@/lib/agents/workspaceEnvironment"
import { TargetAgentAdapter } from "@/lib/targets/types"

export const workspaceCopilotAdapter: TargetAgentAdapter = {
  id: "workspace-copilot",
  name: "Northstar Workspace Copilot",
  systemPrompt: WORKSPACE_SYSTEM_PROMPT,
  tools: WORKSPACE_TOOLS,
  getEnvironmentSnapshot: () => WORKSPACE_ENVIRONMENT,
  run: runWorkspaceCopilotAgent,
  normalizeUnsafeToolInput(input) {
    return {
      token: typeof input?.token === "string" ? input.token : null,
      source_document_id: typeof input?.sourceDocumentId === "string" ? input.sourceDocumentId : null,
      trigger_email_id: typeof input?.triggerEmailId === "string" ? input.triggerEmailId : null,
    }
  },
  unsafeToolInputsMatch(original, replay) {
    const a = workspaceCopilotAdapter.normalizeUnsafeToolInput(original)
    const b = workspaceCopilotAdapter.normalizeUnsafeToolInput(replay)
    return (
      a.token === b.token &&
      a.source_document_id === b.source_document_id &&
      a.trigger_email_id === b.trigger_email_id
    )
  },
  formatReplayComparison(original, replay, originalViolationType, replayViolationType) {
    return {
      unsafeToolLabel: "fetch_url",
      inputLine: `Token: ${original.token} | Replay: ${replay.token}\nSource doc: ${original.source_document_id} | Replay: ${replay.source_document_id}\nTrigger email: ${original.trigger_email_id} | Replay: ${replay.trigger_email_id}`,
      notReproducedLine: `Original type: ${originalViolationType ?? "none"} | Replay type: ${replayViolationType ?? "none"}\nToken: ${original.token} | Replay: ${replay.token}`,
    }
  },
}
