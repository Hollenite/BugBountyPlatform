# Implementation Checks

## Current Goal
- Add the minimal UI on top of the already working terminal/core backend loop.

## Done
- Created `context/` and moved both planning docs into it.
- Read `context/failbounty-v4-final.md` as the main plan.
- Read `context/failbounty-v4-implementation-issues-companion.md` as required corrections/guardrails.
- Chosen implementation order: fix validation/schema first, then seed/session/message/submission/replay/approve/reportHash, prove via terminal, UI later.
- Checked repo state: no existing app/backend scaffold yet; only context docs and local Claude skill/config files exist.
- Bootstrapped a minimal Next.js + Prisma project structure.
- Implemented schema, constants, hashing, validation, session manager, deterministic refund agent, replay engine, seed script, and core API routes.
- Applied required backend fixes: non-UUID `programId` support, hard tool-loop cap, deterministic exploit path, explicit refund policy, order+amount replay comparison, persisted replay detail/comparison, atomic status updates, atomic submission creation, off-chain report proof hashing.
- Fixed a Prisma transaction bug in submission/review flow.
- Proved terminal loop end-to-end:
  - seeded users/program
  - started session
  - sent exploit message
  - produced `confirmed_violation`
  - submitted finding
  - ran replay with `replayResult = "reproduced_exact"`
  - approved with verifier note
  - generated `reportHash`

## In Progress
- Adding only the required UI: bounty board, sandbox chat + trace viewer, submission flow, verifier review/replay/approve.

## Blocked / Risks
- UI should stay thin and use the already-proven API flow.
- Need final verification pass before calling the work done.

## Next
- Add minimal pages/components.
- Run build checks.
- Run independent verification.
