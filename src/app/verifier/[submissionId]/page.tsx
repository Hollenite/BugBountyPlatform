import Link from "next/link"
import { TraceViewer } from "@/components/TraceViewer"
import { VerifierActions } from "@/components/VerifierActions"
import { cardStyle, pageStyle } from "@/components/styles"

async function getReview(submissionId: string) {
  const res = await fetch(`http://localhost:3000/api/submissions/${submissionId}/review`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export default async function SubmissionReviewPage({ params }: { params: { submissionId: string } }) {
  const review = await getReview(params.submissionId)

  if (!review) {
    return (
      <main style={pageStyle}>
        <p>Submission not found.</p>
        <Link href="/verifier">Back to queue</Link>
      </main>
    )
  }

  const { submission, replayBundleMetadata, events } = review

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Verifier Review</h1>
          <p style={{ color: "#cbd5e1" }}>{submission.title}</p>
        </div>
        <Link href="/verifier">Back to queue</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Submission</h2>
            <p><strong>Status:</strong> {submission.status}</p>
            <p><strong>Replay:</strong> {submission.replayResult ?? "pending"}</p>
            <p><strong>Evidence hash:</strong> {submission.evidenceHash}</p>
            <p><strong>Report hash:</strong> {submission.reportHash ?? "not generated"}</p>
            <p><strong>Researcher wallet:</strong> {submission.researcherWallet ?? "not set"}</p>
            <p><strong>Description:</strong> {submission.description}</p>
            <p><strong>Steps:</strong> {submission.stepsToRepro}</p>
            <p><strong>Expected:</strong> {submission.expectedBehavior}</p>
            <p><strong>Actual:</strong> {submission.actualBehavior}</p>
            <p><strong>Replay detail:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{submission.replayDetail ?? "Not run yet"}</pre>
            <p><strong>Replay comparison:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{submission.replayComparison ?? "Not run yet"}</pre>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Replay bundle metadata</h2>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(replayBundleMetadata, null, 2)}</pre>
          </div>

          <VerifierActions submissionId={submission.id} currentStatus={submission.status} replayResult={submission.replayResult} />
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Trace viewer</h2>
          <TraceViewer events={events} />
        </div>
      </div>
    </main>
  )
}
