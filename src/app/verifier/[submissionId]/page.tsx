import Link from "next/link"
import { TraceViewer } from "@/components/TraceViewer"
import { VerifierActions } from "@/components/VerifierActions"
import { AdvancedSection, EmptyState, MetricCard, PageHeader, Pill, StatusBadge, SurfaceCard } from "@/components/ui"
import { formatHash, getSubmissionReview } from "@/lib/server/queries"

export default async function SubmissionReviewPage({ params }: { params: { submissionId: string } }) {
  const review = await getSubmissionReview(params.submissionId)

  if (!review) {
    return (
      <main className="page-shell">
        <EmptyState title="Submission not found" description="The verifier review entry could not be loaded." action={<Link href="/verifier" className="button button--secondary">Back to queue</Link>} />
      </main>
    )
  }

  const { submission, program, researcher, events, replayEvents, replayBundleMetadata, defaultVerifierId } = review
  const comparisonEntries = Object.entries(submission.replayComparisonData ?? {})

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Verifier review"
        title={submission.title}
        description="Inspect the original unsafe execution, confirm the replay outcome, and decide whether the evidence is strong enough to generate proof."
        actions={<Link href="/verifier" className="button button--secondary">Back to queue</Link>}
      />

      <section className="metric-grid">
        <MetricCard label="Replay verdict" value={submission.replayResult ?? "pending"} hint="Approval is unlocked only for reproduced_exact." />
        <MetricCard label="Unsafe execution" value={submission.status === "accepted" ? "Verified" : "Under review"} hint="Focus stays on the unsafe agent-tool path." />
        <MetricCard label="Evidence hash" value={submission.evidenceHashShort} hint="Original trace proof artifact." />
        <MetricCard label="Report hash" value={submission.reportHashShort} hint="Generated after verifier approval." />
      </section>

      <section className="review-grid">
        <div className="stack">
          <SurfaceCard className="review-hero">
            <div className="inline-pills">
              <StatusBadge status={submission.status} />
              <StatusBadge status={submission.replayResult} />
              {submission.severity ? <Pill tone="warning">{submission.severity}</Pill> : null}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Program · {program.name} · Researcher · {researcher.name} · Created {submission.createdAtLabel}
            </p>
            <div className="stack" style={{ gap: 14 }}>
              <div>
                <h3>Incident summary</h3>
                <p className="muted" style={{ margin: "10px 0 0", lineHeight: 1.7 }}>{submission.description}</p>
              </div>
              <div className="metrics-row">
                <SurfaceCard>
                  <div className="stack" style={{ gap: 8 }}>
                    <span className="muted">Expected behavior</span>
                    <p style={{ margin: 0 }}>{submission.expectedBehavior}</p>
                  </div>
                </SurfaceCard>
                <SurfaceCard>
                  <div className="stack" style={{ gap: 8 }}>
                    <span className="muted">Actual behavior</span>
                    <p style={{ margin: 0 }}>{submission.actualBehavior}</p>
                  </div>
                </SurfaceCard>
              </div>
              <SurfaceCard>
                <div className="stack" style={{ gap: 10 }}>
                  <h3>Reproduction by rerun</h3>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{submission.stepsToRepro}</p>
                </div>
              </SurfaceCard>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack">
              <h3>Replay comparison</h3>
              <div className="check-grid">
                {comparisonEntries.length === 0 ? (
                  <div className="notice notice--warning"><p>Replay comparison is not available until replay has been executed.</p></div>
                ) : (
                  comparisonEntries.map(([key, value]) => (
                    <div key={key} className="check-row">
                      <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</span>
                      <span>{value ? "Match" : "Mismatch"}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="notice notice--success">
                <p>{submission.replayDetail ?? "Run replay to populate the exact reproduction detail."}</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack" style={{ gap: 12 }}>
              <h3>Proof artifacts</h3>
              <div className="kv-list">
                <div className="kv-row"><span className="kv-row__label">Evidence hash</span><span className="kv-row__value mono">{submission.evidenceHash ?? "Not available"}</span></div>
                <div className="kv-row"><span className="kv-row__label">Report hash</span><span className="kv-row__value mono">{submission.reportHash ?? "Not generated"}</span></div>
                <div className="kv-row"><span className="kv-row__label">Researcher wallet</span><span className="kv-row__value mono">{submission.researcherWallet ?? researcher.wallet ?? "Not set"}</span></div>
                <div className="kv-row"><span className="kv-row__label">Reward tier</span><span className="kv-row__value">{submission.payoutLabel ?? program.rewardHighLabel ?? "Pending"}</span></div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <TraceViewer events={events} title="Original evidence trace" />
          </SurfaceCard>

          <SurfaceCard>
            <TraceViewer events={replayEvents} title="Replay trace" />
          </SurfaceCard>

          <AdvancedSection title="Advanced metadata">
            <div className="stack">
              <pre>{JSON.stringify(replayBundleMetadata, null, 2)}</pre>
              <pre>{JSON.stringify({
                submissionId: submission.id,
                replaySessionId: submission.replaySessionId,
                reportHashShort: formatHash(submission.reportHash),
                chainFindingId: submission.chainFindingId,
                submitFindingTx: submission.submitFindingTx,
                payoutTx: submission.payoutTx,
              }, null, 2)}</pre>
            </div>
          </AdvancedSection>
        </div>

        <aside className="sticky-rail">
          <SurfaceCard>
            <div className="stack">
              <h3>Decision rail</h3>
              <p className="muted" style={{ margin: 0 }}>
                Approval remains blocked until the rerun is exact across unsafe action, prompt, tool config, and environment checks.
              </p>
              <div className="inline-pills">
                <StatusBadge status={submission.status} />
                <StatusBadge status={submission.replayResult} />
              </div>
            </div>
          </SurfaceCard>

          <VerifierActions
            submissionId={submission.id}
            currentStatus={submission.status}
            replayResult={submission.replayResult}
            defaultVerifierId={defaultVerifierId}
          />
        </aside>
      </section>
    </main>
  )
}
