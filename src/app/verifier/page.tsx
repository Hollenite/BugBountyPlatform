import Link from "next/link"
import { EmptyState, MetricCard, PageHeader, PrimaryLink, StatusBadge, SurfaceCard } from "@/components/ui"
import { getSubmissionsForQueue } from "@/lib/server/queries"

export default async function VerifierQueuePage() {
  const submissions = await getSubmissionsForQueue()
  const pendingCount = submissions.filter((submission) => submission.status === "pending").length
  const acceptedCount = submissions.filter((submission) => submission.status === "accepted").length
  const exactReplayCount = submissions.filter((submission) => submission.replayResult === "reproduced_exact").length

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Verifier flow"
        title="Verifier queue"
        description="Triage captured findings, rerun exact reproduction, and approve only when the unsafe action, prompt, tool config, and environment still line up."
        actions={<PrimaryLink href="/board">Back to bounty board</PrimaryLink>}
      />

      <section className="metrics-row">
        <MetricCard label="Pending review" value={pendingCount} hint="Submissions still awaiting a final verifier decision." />
        <MetricCard label="Exact replays" value={exactReplayCount} hint="Findings already proven by reproduction-by-rerun." />
        <MetricCard label="Accepted findings" value={acceptedCount} hint="Resolved with off-chain proof artifacts generated." />
      </section>

      {submissions.length === 0 ? (
        <EmptyState title="No verifier work yet" description="Create a researcher submission first, then return here to inspect the queue." />
      ) : (
        <section className="queue-list">
          {submissions.map((submission) => (
            <SurfaceCard key={submission.id} className="queue-card">
              <div className="queue-card__top">
                <div className="stack" style={{ gap: 12 }}>
                  <div className="inline-pills">
                    <StatusBadge status={submission.status} />
                    <StatusBadge status={submission.replayResult} />
                  </div>
                  <div className="stack" style={{ gap: 8 }}>
                    <h2>{submission.title}</h2>
                    <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{submission.description}</p>
                  </div>
                </div>
                <div className="stack" style={{ gap: 12, alignItems: "end" }}>
                  <span className="badge badge--accent">Top reward · {submission.topRewardLabel ?? "—"}</span>
                  <span className="badge">Researcher · {submission.researcher.name}</span>
                </div>
              </div>

              <div className="queue-card__meta">
                <span>Program · {submission.program.name}</span>
                <span>Created · {submission.createdAtLabel}</span>
                <span>Resolved · {submission.resolvedAtLabel}</span>
              </div>

              <div className="page-header__actions">
                <Link href={`/verifier/${submission.id}`} className="button button--primary">Open review</Link>
              </div>
            </SurfaceCard>
          ))}
        </section>
      )}
    </main>
  )
}
