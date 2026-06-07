# Project Structure for Agents

This file is the quick map for agents changing FailBounty.

## Root

- `README.md`: setup, scripts, routes, and structure.
- `CONTEXT.md`: product language, invariants, and constraints.
- `AGENTS.md`: repo-specific agent instructions.
- `package.json`: scripts and dependencies.
- `next.config.js`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `.env.local`: local runtime env, not committed.

## Planning Context

- `context/failbounty-v4-final.md`: original v4 plan and product framing.
- `context/failbounty-v4-implementation-issues-companion.md`: corrections and guardrails for the v4 plan.
- `context/implementation-checks.md`: latest status and verification notes from prior implementation work.
- `context/session_id.md`: session bookkeeping.

## Prisma

- `prisma/schema.prisma`: source of truth for persisted models.
- `prisma/schema.postgres.prisma`: managed Postgres deployment schema for private alpha.
- `prisma/migrations/`: additive SQLite local-development migrations.
- `prisma/postgres-migrations/`: SQL baseline for managed Postgres deployment.
- `prisma/seed.ts`: creates demo company, researcher, verifier, and `prog-refund-demo`.
- `prisma/prisma/dev.db`: local SQLite database. Treat as generated/local state.

## App Routes

- `src/app/page.tsx`: homepage overview.
- `src/app/sign-in/page.tsx`: private-alpha email sign-in.
- `src/app/account/page.tsx`: current session and wallet-link surface.
- `src/app/programs/page.tsx`: program board.
- `src/app/programs/new/page.tsx`: company hosted-sandbox creation page.
- `src/app/programs/[id]/page.tsx`: program detail.
- `src/app/lab/page.tsx`: legacy redirect to `/lab/[programId]`.
- `src/app/lab/[programId]/page.tsx`: loads program data and lab presentation.
- `src/app/lab/[programId]/ProgramLabConsole.tsx`: main researcher/security-test client UI.
- `src/app/submissions/page.tsx`: submission queue.
- `src/app/submissions/[id]/page.tsx`: submission review page.
- `src/app/verifier/page.tsx`: verifier workspace route.
- `src/app/verifier/[submissionId]/page.tsx`: verifier review route.
- `src/app/board/page.tsx`: legacy redirect to `/programs`.

## API Routes

- `src/app/api/programs/route.ts`: list active programs.
- `src/app/api/auth/sign-in/route.ts`: create an app session for an invited email.
- `src/app/api/auth/sign-out/route.ts`: clear the current app session.
- `src/app/api/auth/me/route.ts`: return the current signed-in user.
- `src/app/api/wallet/nonce/route.ts`: issue a MetaMask link nonce.
- `src/app/api/wallet/verify/route.ts`: verify a signed wallet-link message.
- `src/app/api/sessions/start/route.ts`: create a researcher session.
- `src/app/api/sessions/message/route.ts`: run a prompt through the agent and record trace events.
- `src/app/api/submissions/route.ts`: list/create findings.
- `src/app/api/verify/[submissionId]/route.ts`: replay, approve, or reject a finding.

## Components

- `src/components/ui.tsx`: shared UI primitives.
- `src/components/SignInForm.tsx`: private-alpha email sign-in client.
- `src/components/WalletLinker.tsx`: MetaMask link client.
- `src/components/ProgramCreateForm.tsx`: company hosted-program form.
- `src/components/styles.ts`: shared style helpers.
- `src/components/ProgramBoard.tsx`: program list cards.
- `src/components/TraceViewer.tsx`: event timeline display.
- `src/components/SubmissionForm.tsx`: finding submission form.
- `src/components/VerifierActions.tsx`: verifier replay/approval/rejection actions.

## Domain Logic

- `src/lib/constants.ts`: model config, demo environment, reward tiers, and feature flags.
- `src/lib/demoContent.ts`: demo copy and presentation helpers.
- `src/lib/db.ts`: Prisma client.
- `src/lib/auth/session.ts`: app session creation, lookup, and cookie helpers.
- `src/lib/auth/roles.ts`: role vocabulary and server-side role assertions.
- `src/lib/auth/wallet.ts`: wallet nonce message and signature verification.
- `src/lib/programs/config.ts`: approved hosted agent templates and typed config validation.
- `src/lib/validation.ts`: Zod schemas for API requests.
- `src/lib/agents/refundAgent.ts`: refund-agent scenario and unsafe tool execution flow.
- `src/lib/session/AgentSessionManager.ts`: session creation, event logging, replay bundle construction, and status transactions.
- `src/lib/session/Replayer.ts`: replay-by-rerun logic and replay comparison.
- `src/lib/server/queries.ts`: server-side queries for pages.
- `src/lib/utils/hash.ts`: stable hash utilities.

## Flow: Researcher Finding

1. `/programs` selects `prog-refund-demo`.
2. `/sign-in` creates an email app session for the researcher.
3. `/lab/[programId]` creates a session through `POST /api/sessions/start`; the researcher comes from the session cookie.
4. The lab runs a scenario through `POST /api/sessions/message`.
5. `refundAgent.ts` logs tool use, tool results, policy checks, and a confirmed violation.
6. `SubmissionForm` posts to `POST /api/submissions`.
7. The submission route verifies researcher ownership, active session state, and a confirmed violation.
8. The route computes `evidenceHash`, creates `Submission`, stores the linked wallet as metadata, and marks the session submitted.

## Flow: Verifier Review

1. `/submissions` or `/verifier` opens the queue.
2. `/submissions/[id]` or `/verifier/[submissionId]` displays the finding.
3. `VerifierActions` posts `action: "replay"` to `POST /api/verify/[submissionId]`; the verifier comes from the session cookie.
4. `Replayer.ts` builds a replay bundle, creates a verifier replay session, reruns the prompt, and compares hashes/tool input.
5. Approval is allowed only when replay status is `reproduced_exact`.
6. Approval stores severity, verifier note, payout tier, report hash, and resolution timestamp.

## Change Guidance

- Keep API validation in `src/lib/validation.ts`.
- Keep database changes in `prisma/schema.prisma` plus seed updates when needed.
- Keep UI language aligned with `CONTEXT.md`.
- When changing replay semantics, update `Replayer.ts`, verifier API logic, docs, and UI copy together.
- When changing submission semantics, review `Submission.sessionId @unique`, `POST /api/submissions`, `SubmissionForm`, and evidence hash policy.
