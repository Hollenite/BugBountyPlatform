# Agent Instructions

This repo is the FailBounty demo application. Treat it as a Next.js 14 App Router product demo for replayable AI-agent security findings, not a generic bug bounty template.

## Start Here

Read these files before changing behavior:

- `README.md` for setup, scripts, and project structure.
- `CONTEXT.md` for product vocabulary, domain rules, and current constraints.
- `context/implementation-checks.md` for the latest local implementation status.
- `context/failbounty-v4-final.md` for the original v4 implementation plan.
- `context/failbounty-v4-implementation-issues-companion.md` for known guardrails and corrections.
- `docs/agents/project-structure.md` for the code map and main flows.

## Product Framing

Use "unsafe agent-tool execution", "security test session", "structured trace", "reproduction-by-rerun", "verifier review", and "proof hash" language.

Avoid overstating the product as deterministic replay, real-money payouts, production auth, or a full blockchain reward system. Blockchain/testnet anchoring is optional and secondary to the off-chain proof flow unless the user explicitly reopens that scope.

## Development Rules

- Preserve the current demo loop: program -> lab session -> trace capture -> finding submission -> verifier replay -> approval/rejection.
- Approval must stay gated on `reproduced_exact` unless the product model is explicitly redesigned.
- Keep role strings (`researcher`, `verifier`, `company`) compatible with the current Prisma schema and seeded demo data.
- Use existing UI primitives in `src/components/ui.tsx` and app styling in `src/app/globals.css`.
- Do not introduce real auth, payments, or chain writes without a separate scope decision.
- Treat `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, and Prisma SQLite files as generated/local artifacts.

## Agent Skills

### Issue Tracker

Issues are tracked in GitHub for `Hollenite/BugBountyPlatform`. See `docs/agents/issue-tracker.md`.

### Triage Labels

Use the default triage label vocabulary unless the repository config changes. See `docs/agents/triage-labels.md`.

### Domain Docs

This is a single-context repo with root `CONTEXT.md` and optional ADRs under `docs/adr/`. See `docs/agents/domain.md`.


<claude-mem-context>
# Memory Context

# [Archive] recent context, 2026-06-06 1:45am GMT+5:30

No previous sessions found.
</claude-mem-context>