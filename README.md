# FailBounty

FailBounty is a Next.js demo for capturing unsafe AI-agent tool execution as structured evidence, submitting the finding, replaying the scenario by rerun, and approving only when the verifier reproduces the unsafe action exactly.

The current product is moving from a polished hackathon demo toward a private alpha. It now uses email app sessions for actor identity, keeps SQLite as the local development database, includes a Postgres schema for managed deployment, and keeps blockchain/testnet anchoring secondary to the core off-chain proof flow.

## Core Loop

1. Open the program board and select the demo refund-agent program.
2. Start a security test session in the lab.
3. Run the approval-confusion scenario against the refund agent.
4. Capture the event trace and confirmed violation.
5. Submit a finding for verifier review.
6. Replay the captured scenario by rerun.
7. Approve only when replay status is `reproduced_exact`.
8. Generate durable evidence and report hashes.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Prisma 6
- SQLite for local development data
- Managed Postgres deployment schema for private alpha hosting
- Zod for request validation
- Anthropic SDK support, with a deterministic local demo flow available by default
- Ethers dependency reserved for optional testnet anchoring work

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` with at least:

```env
DATABASE_URL="file:./dev.db"
FAILBOUNTY_SESSION_SECRET="replace-with-a-long-random-secret"
FAILBOUNTY_USE_REAL_ANTHROPIC=false
```

If you want to run the live Anthropic path, also set `ANTHROPIC_API_KEY` and change `FAILBOUNTY_USE_REAL_ANTHROPIC=true`.

Generate the Prisma client and sync the SQLite schema:

```bash
npm run prisma:generate
npm run prisma:push
```

Seed the private-alpha demo accounts and hosted sandbox program:

```bash
npm run db:seed
```

Seeded sign-in emails:

- `researcher@demo.com`
- `verifier@demo.com`
- `acme@demo.com`

Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Scripts

- `npm run dev` starts the Next.js dev server.
- `npm run build` builds the production app.
- `npm run start` runs the production server after a build.
- `npm run start:demo` runs the demo startup script.
- `npm test` runs focused Node tests for private-alpha auth and config helpers.
- `npm run lint` runs Next lint.
- `npm run prisma:generate` generates the Prisma client.
- `npm run prisma:push` applies the Prisma schema to SQLite.
- `npm run prisma:migrate:dev` creates local Prisma migrations.
- `npm run prisma:migrate:deploy` applies migrations for the default schema.
- `npm run prisma:validate:postgres` validates the managed Postgres schema when `POSTGRES_DATABASE_URL` is set.
- `npm run db:seed` seeds demo users and `prog-refund-demo`.

## Project Structure

```text
.
|-- AGENTS.md                         # Repo instructions for coding agents
|-- CONTEXT.md                        # Domain glossary and product constraints
|-- README.md                         # Setup and structure overview
|-- context/                          # Planning docs and implementation status
|-- docs/agents/                      # Agent-facing workflow/context docs
|-- prisma/
|   |-- schema.prisma                 # User, Program, AgentSession, TraceEvent, Submission
|   |-- seed.ts                       # Demo data seed script
|   `-- prisma/dev.db                 # Local SQLite database
|-- scripts/
|   `-- start-demo.sh                 # Demo launcher helper
|-- src/
|   |-- app/                          # Next App Router pages and API routes
|   |-- components/                   # Shared UI and workflow components
|   |-- lib/                          # Domain logic, DB, validation, replay, agents
|   `-- types/                        # Shared domain types
|-- package.json
`-- tsconfig.json
```

## Important Routes

- `/` is the product overview.
- `/programs` lists available agent security programs.
- `/programs/[id]` shows a program detail page.
- `/lab/[programId]` runs the security test lab.
- `/submissions` lists submitted findings.
- `/submissions/[id]` shows the verifier review surface for a finding.
- `/sign-in` signs in an invited private-alpha account by email.
- `/account` shows the current email session and MetaMask wallet-link status.
- `/verifier` redirects into the verifier workspace flow.
- `/board` redirects to `/programs` for legacy compatibility.
- `/lab?programId=...` redirects to `/lab/[programId]` for legacy compatibility.

## API Routes

- `POST /api/sessions/start` creates a researcher security test session.
- `POST /api/sessions/message` runs the refund-agent scenario and records trace events.
- `GET /api/programs` returns active programs.
- `POST /api/programs` lets an authenticated company create a private hosted sandbox program from approved templates.
- `POST /api/auth/sign-in` creates an app session for an existing invited email.
- `POST /api/auth/sign-out` clears the current app session.
- `GET /api/auth/me` returns the current signed-in user.
- `POST /api/wallet/nonce` issues a MetaMask link nonce for the current user.
- `POST /api/wallet/verify` verifies a signed MetaMask message and stores the checksummed wallet address.
- `GET /api/submissions` lists submissions.
- `POST /api/submissions` creates a finding from a researcher session with a confirmed violation.
- `POST /api/verify/[submissionId]` handles replay, approval, and rejection.

## Domain Model

- `User` represents demo actors with roles: `company`, `researcher`, or `verifier`.
- `AppSession` stores signed app sessions; API routes derive actors from the HTTP-only session cookie.
- `Program` represents an agent security program and its reward metadata.
- `AgentSession` represents a researcher run or verifier replay run.
- `TraceEvent` stores ordered evidence events for a session.
- `Submission` stores the finding, replay metadata, verifier decision, and hashes.

## Main Code Paths

- `src/lib/agents/refundAgent.ts` contains the refund-agent scenario and unsafe tool path.
- `src/lib/session/AgentSessionManager.ts` creates sessions and records trace events.
- `src/lib/session/Replayer.ts` rebuilds a replay bundle, reruns the scenario, and classifies the replay status.
- `src/app/api/submissions/route.ts` enforces confirmed-violation submission requirements and computes `evidenceHash`.
- `src/app/api/verify/[submissionId]/route.ts` enforces verifier-only actions and gates approval on `reproduced_exact`.
- `src/lib/auth/session.ts` creates, verifies, and clears app sessions.
- `src/lib/auth/wallet.ts` issues wallet-link messages and verifies MetaMask signatures.
- `src/lib/programs/config.ts` validates approved hosted sandbox templates and typed program config.
- `src/lib/server/queries.ts` contains server-side page queries for programs and submissions.

## Product Constraints

- Replay is reproduction-by-rerun, not perfect deterministic execution replay.
- Findings currently require a confirmed violation event.
- A session currently produces at most one submission because `Submission.sessionId` is unique.
- Approval requires `reproduced_exact`.
- Email app sessions are the primary actor identity for private alpha routes.
- MetaMask is linked wallet metadata only, not primary authentication.
- Hosted programs are created from approved FailBounty templates; arbitrary external target execution is deferred.
- Rewards are symbolic/testnet-oriented and should not be described as real USD payouts.
- Optional chain anchoring should not become the primary product path without a separate design decision.

## Private Alpha Deployment Notes

For Vercel plus managed Postgres:

1. Set `POSTGRES_DATABASE_URL` to the managed database URL.
2. Set `FAILBOUNTY_SESSION_SECRET` to a long random value.
3. Validate the deployment schema with `npm run prisma:validate:postgres`.
4. Apply `prisma/postgres-migrations/0001_private_alpha_foundation/migration.sql` to the managed database, or use `prisma/schema.postgres.prisma` as the baseline schema for a fresh deployment migration.
5. Seed invited users and the hosted sandbox with `npm run db:seed` after pointing `DATABASE_URL` or the deployment Prisma schema at the target database.

## Generated and Local Files

Do not treat these as source of truth:

- `.next/`
- `node_modules/`
- `tsconfig.tsbuildinfo`
- `prisma/prisma/dev.db`
- `.env`
- `.env.local`

## More Context

For agents and future maintainers:

- `CONTEXT.md` defines product language and invariants.
- `docs/agents/project-structure.md` gives a quick code map.
- `docs/agents/domain.md` explains how agent skills should consume domain docs.
- `context/implementation-checks.md` captures the latest implementation status from prior work.
