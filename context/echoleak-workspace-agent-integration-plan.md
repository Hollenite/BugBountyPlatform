# FailBounty — EchoLeak-Style Workspace Agent Integration Plan

> Copied from user-provided plan. See original at `d:\Downloads\echoleak-workspace-agent-integration-plan.md`.

## Purpose

Companion plan for upgrading FailBounty from a single refund-agent demo into a more credible AI-agent bug bounty target inspired by the EchoLeak / Microsoft 365 Copilot vulnerability class.

**Not** reproducing or targeting Microsoft 365 Copilot. Build a **safe synthetic enterprise workspace sandbox** demonstrating:

> An AI workspace assistant consumes untrusted email content, reads private internal documents, follows malicious instructions embedded in the email, and leaks a synthetic secret to a controlled canary endpoint.

Target program: **Northstar Workspace Copilot** — indirect prompt injection / cross-boundary data exfiltration.

Keep refund agent as fallback. Do not delete it.

## Build Order

1. Target adapter abstraction (`src/lib/targets/`)
2. Workspace environment constants (`src/lib/agents/workspaceEnvironment.ts`)
3. Workspace copilot deterministic agent (`src/lib/agents/workspaceCopilotAgent.ts`)
4. Session message route dispatches by `program.agentId`
5. Replay engine supports target-specific comparison
6. Seed `prog-workspace-copilot`
7. Target-aware lab UI (inbox/docs/canary)
8. Evidence summary + submission defaults
9. Verifier comparison for token/source doc/trigger email
10. Core-loop test for workspace target
11. Ensure refund target still works

## Constraints

- Deterministic simulation first — no Anthropic token burn
- Fake data only, local canary only
- Approval requires `reproduced_exact`
- Backend loop before UI polish

See full plan in Downloads for sandbox data, UI specs, acceptance criteria, and demo narrative.
