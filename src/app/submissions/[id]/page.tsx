import Link from "next/link"
import { redirect } from "next/navigation"
import { ChainRecordButton } from "@/components/ChainRecordButton"
import { TraceViewer } from "@/components/TraceViewer"
import { VerifierActions } from "@/components/VerifierActions"
import { AdvancedSection, EmptyState, PageHeader, Pill, SecondaryLink, StatusBadge, SurfaceCard } from "@/components/ui"
import { getSubmissionReview } from "@/lib/server/queries"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const [user, review] = await Promise.all([getCurrentUserFromCookies(), getSubmissionReview(params.id)])
  if (!user) redirect("/sign-in")
  if (user.role !== "verifier") redirect("/programs")

  if (!review) {
    return (
      <main className="page-shell">
        <EmptyState title="Submission not found" description="The verifier workspace could not load this finding." action={<Link href="/submissions" className="button button--secondary">Back to submissions</Link>} />
      </main>
    )
  }

  const { submission, program, researcher, events, replayEvents, comparisonFacts, originalSessionMetadata, replaySessionMetadata } = review
  const requiredAction =
    submission.status !== "pending"
      ? "No action required. This finding is resolved."
      : submission.replayResult === "reproduced_exact"
        ? "Approve or reject the finding."
        : "Run verifier rerun."
  const rerunSummary =
    submission.replayResult === "reproduced_exact"
      ? "Verifier rerun is an exact match. Approval can proceed."
      : submission.replayResult
        ? "Verifier rerun completed with mismatches. Approval remains blocked."
        : "Run verifier rerun to populate the comparison."
  const visibleComparisonFacts = comparisonFacts.filter((fact) =>
    ["Violation type", "Tool name", "Order ID", "Amount", "Environment"].includes(fact.label),
  )
  const technicalComparisonFacts = comparisonFacts.filter((fact) => !visibleComparisonFacts.includes(fact))

  return (
    <main className="page-shell">
      <PageHeader
        title={submission.title}
        description="Rerun the submitted finding and approve only if the unsafe tool execution matches exactly."
        actions={
          <div className="page-header__actions">
            <SecondaryLink href="/submissions">Back to submissions</SecondaryLink>
          </div>
        }
      />

      <section className="review-grid">
        <div className="stack">
          <SurfaceCard className="review-hero">
            <div className="inline-pills">
              <StatusBadge status={submission.status} />
              <StatusBadge status={submission.replayResult} />
              {submission.severity ? <Pill tone="warning">{submission.severity}</Pill> : null}
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <h2>Required next action</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{requiredAction}</p>
            </div>
            <div className="kv-list">
              <div className="kv-row"><span className="kv-row__label">Current status</span><span className="kv-row__value"><StatusBadge status={submission.status} /></span></div>
              <div className="kv-row"><span className="kv-row__label">Rerun status</span><span className="kv-row__value"><StatusBadge status={submission.replayResult} /></span></div>
              <div className="kv-row"><span className="kv-row__label">Program</span><span className="kv-row__value">{program.name}</span></div>
              <div className="kv-row"><span className="kv-row__label">Researcher</span><span className="kv-row__value">{researcher.name}</span></div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack" style={{ gap: 12 }}>
              <h2>Finding summary</h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{submission.description}</p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack" style={{ gap: 12 }}>
              <h2>Expected vs actual behavior</h2>
              <div className="kv-list">
                <div className="kv-row"><span className="kv-row__label">Expected</span><span className="kv-row__value">{submission.expectedBehavior}</span></div>
                <div className="kv-row"><span className="kv-row__label">Actual</span><span className="kv-row__value">{submission.actualBehavior}</span></div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack" style={{ gap: 14 }}>
              <h2>Rerun comparison</h2>
              <div className="comparison-table">
                {visibleComparisonFacts.map((fact) => (
                  <div key={fact.label} className="comparison-row">
                    <span className="comparison-row__label">{fact.label}</span>
                    <span>{fact.original}</span>
                    <span>{fact.replay}</span>
                    <span className="comparison-row__status">
                      {fact.match === true ? <Pill tone="success">Match</Pill> : fact.match === false ? <Pill tone="danger">Mismatch</Pill> : <Pill>Pending</Pill>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="notice notice--warning">
                <p>{rerunSummary}</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <TraceViewer events={events} title="Evidence timeline" />
          </SurfaceCard>

          {replayEvents.length > 0 ? (
            <SurfaceCard>
              <TraceViewer events={replayEvents} title="Verifier rerun timeline" />
            </SurfaceCard>
          ) : null}

          <AdvancedSection title="Technical details">
            <div className="stack">
              {technicalComparisonFacts.length > 0 ? (
                <div className="comparison-table">
                  {technicalComparisonFacts.map((fact) => (
                    <div key={fact.label} className="comparison-row">
                      <span className="comparison-row__label">{fact.label}</span>
                      <span className={fact.mono ? "mono" : undefined}>{fact.original}</span>
                      <span className={fact.mono ? "mono" : undefined}>{fact.replay}</span>
                      <span className="comparison-row__status">
                        {fact.match === true ? <Pill tone="success">Match</Pill> : fact.match === false ? <Pill tone="danger">Mismatch</Pill> : <Pill>Pending</Pill>}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {submission.replayDetail ? <pre>{submission.replayDetail}</pre> : null}
              <pre>{JSON.stringify({ originalSessionMetadata, replaySessionMetadata }, null, 2)}</pre>
              <pre>{JSON.stringify({ submissionId: submission.id, replaySessionId: submission.replaySessionId, researcherWallet: submission.researcherWallet, evidenceHash: submission.evidenceHash, reportHash: submission.reportHash }, null, 2)}</pre>
            </div>
          </AdvancedSection>
        </div>

        <aside className="sticky-rail">
          <SurfaceCard>
            <div className="stack" style={{ gap: 12 }}>
              <h3>Verifier actions</h3>
              <p className="muted" style={{ margin: 0 }}>
                Run verifier rerun first. Approval stays disabled unless the rerun status is an exact match.
              </p>
              <div className="inline-pills">
                <StatusBadge status={submission.status} />
                <StatusBadge status={submission.replayResult} />
              </div>
            </div>
          </SurfaceCard>

          <VerifierActions submissionId={submission.id} currentStatus={submission.status} replayResult={submission.replayResult} />
          <ChainRecordButton
            submissionId={submission.id}
            status={submission.status}
            replayResult={submission.replayResult}
            chainProgramIndex={program.chainProgramIndex}
            chainFindingId={submission.chainFindingId}
            submitFindingTx={submission.submitFindingTx}
            reportHash={submission.reportHash}
            evidenceHash={submission.evidenceHash}
            researcherWallet={submission.researcherWallet ?? researcher.wallet}
          />
        </aside>
      </section>
    </main>
  )
}
