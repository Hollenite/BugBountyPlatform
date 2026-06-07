import Link from "next/link"
import { redirect } from "next/navigation"
import { EmptyState, PageHeader, SecondaryLink, StatusBadge, SurfaceCard } from "@/components/ui"
import { getSubmissionsForQueue } from "@/lib/server/queries"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

export default async function SubmissionsPage() {
  const [user, submissions] = await Promise.all([getCurrentUserFromCookies(), getSubmissionsForQueue()])
  if (!user) redirect("/sign-in")
  if (user.role !== "verifier") redirect("/programs")

  const pendingCount = submissions.filter((submission) => submission.status === "pending").length
  const acceptedCount = submissions.filter((submission) => submission.status === "accepted").length
  const rejectedCount = submissions.filter((submission) => submission.status === "rejected").length
  const replayCompleteCount = submissions.filter((submission) => submission.replayResult !== null).length

  return (
    <main className="page-shell">
      <PageHeader
        title="Verifier Review"
        description="Rerun submitted findings and approve only exact matches."
        actions={<SecondaryLink href="/programs">Back to programs</SecondaryLink>}
      />

      <section className="tabs" aria-label="Queue status">
        <span className="tab-pill">Waiting {pendingCount}</span>
        <span className="tab-pill">Rerun complete {replayCompleteCount}</span>
        <span className="tab-pill">Approved {acceptedCount}</span>
        <span className="tab-pill">Rejected {rejectedCount}</span>
      </section>

      {submissions.length === 0 ? (
        <EmptyState title="No submissions yet" description="Run a security test session first, then return here to inspect the verifier workspace." />
      ) : (
        <section className="queue-list">
          {submissions.map((submission) => (
            <SurfaceCard key={submission.id} className="queue-row">
              <div className="stack" style={{ gap: 10 }}>
                  <div className="inline-pills">
                    <StatusBadge status={submission.status} />
                    <StatusBadge status={submission.replayResult} />
                  </div>
                  <div className="stack" style={{ gap: 8 }}>
                    <h2>{submission.title}</h2>
                    <div className="queue-card__meta">
                      <span>Program: {submission.program.name}</span>
                      <span>Researcher: {submission.researcher.name}</span>
                      <span>Created: {submission.createdAtLabel}</span>
                    </div>
                  </div>
                </div>

              <div className="page-header__actions">
                <Link href={`/submissions/${submission.id}`} className="button button--primary">Review</Link>
              </div>
            </SurfaceCard>
          ))}
        </section>
      )}
    </main>
  )
}
