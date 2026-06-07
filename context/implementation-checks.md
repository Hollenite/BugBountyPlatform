# Implementation Checks

## Current Goal
- EchoLeak-inspired Northstar Workspace Copilot target integration.

## Done
- Created `context/` and moved both planning docs into it.
- Read `context/failbounty-v4-final.md` as the main plan.
- Read `context/failbounty-v4-implementation-issues-companion.md` as required corrections/guardrails.
- Checked repo state and bootstrapped the minimal Next.js + Prisma app.
- Implemented schema, hashing, validation, session manager, deterministic refund agent, replay engine, seed script, core API routes, and minimal UI pages.
- Applied required backend fixes: non-UUID `programId` support, hard tool-loop cap, deterministic exploit path, explicit refund policy, rerun-based replay, persisted replay detail/comparison, atomic submission/session updates, and off-chain/on-chain separation.
- Proved terminal loop end-to-end.
- Rebuilt the app into a professional AI-agent security review platform with canonical routes.
- Fixed startup script env bootstrapping after pull issues.
- Redesigned the Test Lab into a real bug bounty sandbox:
  - Agent Blueprint
  - Attack Console with guided templates + custom prompt path
  - explicit Open sandbox session / Send to agent flow
  - Tool Monitor
  - Policy Monitor
  - Evidence Summary
  - Evidence Timeline with collapsed raw JSON
  - Finding Composer with evidence-derived prefills
  - raw IDs hidden in Advanced
- Passed final lab verification:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - canonical lab UI sections rendered
  - opening a sandbox session does not auto-run the exploit
  - explicit send triggers confirmed violation path
  - auth and invalid-input adversarial probes rejected correctly

## In Progress
- Target-aware lab UI, evidence summary, submission defaults, verifier comparison cards.

## Done (workspace integration — backend)
- Added target adapter registry (`refund-agent`, `workspace-copilot`).
- Added workspace environment, deterministic copilot agent, canary route.
- Session message + replay dispatch by `agentId`; target-specific violation comparison.
- Seeded `prog-workspace-copilot` (Northstar Labs).
- Core-loop test passes: `data_leak` → `reproduced_exact`.

## Blocked / Risks
- None currently blocking the hackathon demo.

## Next
- Target-aware lab UI (inbox/docs/canary panels, attack templates).
- Workspace evidence summary + submission prefills + verifier comparison UI.
- Regression check refund program end-to-end.
